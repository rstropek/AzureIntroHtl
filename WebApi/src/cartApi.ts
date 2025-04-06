/**
 * Express router module for managing shopping cart API endpoints
 * Handles HTTP requests for cart operations
 */
import express from "express";
import Database from "./sql.js";

/**
 * Creates and configures the Express router for cart operations
 * @param db Database instance for cart data access
 * @returns Configured Express router with cart endpoints
 */
export default function getCartApi(db: Database) {
  const router = express.Router();
  
  /**
   * GET endpoint to retrieve all items in a shopping cart
   * Requires cart ID as a query parameter
   * Returns array of cart items with bouquet details
   */
  router.get("/cart", async (req, res) => {
    const cartId = req.query.id as string;
    if (!cartId) {
      res.status(400).send({ error: "Cart ID is required" });
      return;
    }

    const cartItems = await db.getCartItems(cartId);
    res.send(cartItems);
  });

  return router;
}
