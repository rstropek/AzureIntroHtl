/**
 * Database interaction module for managing shopping cart operations
 * Uses Microsoft SQL Server with Azure Entra ID authentication
 */
import sql from "mssql";
import { ConnectionAuthentication } from "tedious";

// OpenTelemetry for tracing database operations
import { Span, SpanStatusCode, trace } from "@opentelemetry/api";
const tracer = trace.getTracer("database");

/**
 * Represents a shopping cart item with flower bouquet details
 */
type CartItem = {
  id?: number;          // Optional ID, auto-generated for new items
  cartId: string;       // Unique identifier for the cart
  bouquetSize: number;  // Size of the bouquet
  flower: string;       // Type of flower
  color: string;        // Color of the flower
  price: number;        // Price of the bouquet
};

/**
 * Database class for handling cart operations with SQL Server
 * Includes connection pooling and automatic table creation
 */
export default class Database {
  private pool: sql.ConnectionPool | undefined;

  /**
   * Builds SQL Server connection configuration from environment variables
   * Uses Azure Active Directory Default authentication
   * @returns SQL Server connection configuration
   */
  private getConfig(): sql.config {
    const server = process.env.AZURE_SQL_SERVER!;
    const database = process.env.AZURE_SQL_DATABASE!;
    const dbPort = parseInt(process.env.AZURE_SQL_PORT || "1433");

    const config = {
      server,
      dbPort,
      database,
      authentication: {
        type: "azure-active-directory-default",
        options: {},
      } as ConnectionAuthentication,
      options: {
        encrypt: true,
      },
    };
    return config;
  }

  /**
   * Executes database operations with OpenTelemetry tracing
   * Captures errors and span status for monitoring
   * @param spanName Name for the tracing span
   * @param operation Function containing database operation to execute
   * @returns Result of the database operation
   */
  private async executeWithTracing<T>(spanName: string, operation: (span: Span) => Promise<T>): Promise<T> {
    return await tracer.startActiveSpan(spanName, async (span: Span) => {
      try {
        return await operation(span);
      } catch (error: any) {
        span.recordException(error.message ?? "");
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Checks if CartItems table exists in the database
   * @param pool Active SQL connection pool
   * @returns Boolean indicating whether table exists
   */
  private async doesCartItemsTableExist(pool: sql.ConnectionPool): Promise<boolean> {
    const result = await pool.request().query("SELECT TOP 1 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CartItems'");
    return result.recordset.length > 0;
  }

  /**
   * Creates the CartItems table if it doesn't exist
   * Defines schema with Id, CartId, and bouquet details
   * @param pool Active SQL connection pool
   */
  private async ensureCreated(pool: sql.ConnectionPool): Promise<void> {
    await pool.request().query(`
        CREATE TABLE CartItems (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            CartId UNIQUEIDENTIFIER NOT NULL,
            BouquetSize INT NOT NULL,
            Flower NVARCHAR(150) NOT NULL,
            Color NVARCHAR(150) NOT NULL,
            Price DECIMAL(10, 2) NOT NULL
        )`);
  }

  /**
   * Gets or creates a SQL connection pool
   * Ensures the CartItems table exists before returning
   * @returns Active SQL connection pool for operations
   */
  async getConnectionPool(): Promise<sql.ConnectionPool> {
    if (!this.pool) {
      this.pool = await this.executeWithTracing("openConnectionPool", async (span) => {
        const pool = await sql.connect(this.getConfig());
        if (!(await this.doesCartItemsTableExist(pool))) {
          span.addEvent("CartItems table does not exist yet, creating it");
          await this.ensureCreated(pool);
        }
        return pool;
      });
    }
    return this.pool;
  }

  /**
   * Retrieves all cart items for a specific cart ID
   * @param cartId Unique identifier for the cart
   * @returns Array of cart items with their details
   */
  async getCartItems(cartId: string): Promise<CartItem[]> {
    return await this.executeWithTracing("getCartItems", async () => {
      const pool = await this.getConnectionPool();
      const result = await pool.request().input("cartId", cartId).query("SELECT * FROM CartItems WHERE CartId = @cartId");
      return result.recordset.map((record: any) => ({
        id: record.Id,
        cartId: record.CartId,
        bouquetSize: record.BouquetSize,
        flower: record.Flower,
        color: record.Color,
        price: record.Price,
      }));
    });
  }

  /**
   * Adds a new item to the cart
   * Enforces limit of maximum 5 bouquets per cart
   * @param cartItem Cart item to add
   * @returns Success message or error if limit reached
   */
  async addCartItem(cartItem: CartItem): Promise<string> {
    return await this.executeWithTracing("addCartItem", async () => {
      const pool = await this.getConnectionPool();

      // Enforce business rule: maximum 5 bouquets per cart
      const cartItems = await this.getCartItems(cartItem.cartId);
      if (cartItems.length >= 5) {
        return "You cannot have more than 5 bouquets in your cart";
      }

      await pool
        .request()
        .input("cartId", cartItem.cartId)
        .input("bouquetSize", cartItem.bouquetSize)
        .input("flower", cartItem.flower)
        .input("color", cartItem.color)
        .input("price", cartItem.price)
        .query("INSERT INTO CartItems (CartId, BouquetSize, Flower, Color, Price) VALUES (@cartId, @bouquetSize, @flower, @color, @price)");
      return "Cart item added";
    });
  }

  /**
   * Deletes a specific cart item by its ID
   * @param cartItemId ID of the cart item to delete
   */
  async deleteCartItem(cartItemId: number): Promise<void> {
    return await this.executeWithTracing("deleteCartItem", async () => {
      const pool = await this.getConnectionPool();
      await pool.request().input("cartItemId", cartItemId).query("DELETE FROM CartItems WHERE Id = @cartItemId");
    });
  }

  /**
   * Removes all items from a specific cart
   * @param cartId Unique identifier for the cart to clear
   */
  async clearCart(cartId: string): Promise<void> {
    return await this.executeWithTracing("clearCart", async () => {
      const pool = await this.getConnectionPool();
      await pool.request().input("cartId", cartId).query("DELETE FROM CartItems WHERE CartId = @cartId");
    });
  }
}
