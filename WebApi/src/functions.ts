/**
 * Function definitions and handlers for AI assistant capabilities
 * Defines OpenAI Function Tool schema and implementations for cart operations
 */
import { FunctionTool } from "openai/resources/responses/responses.mjs";
import Database from "./sql";

/**
 * Function definition for retrieving cart items
 * Used by AI assistant to get current cart contents
 */
export const getCartItemsFunctionDefinition: FunctionTool  = {
    type: 'function',
    name: 'getCartItems',
    description: 'Gets the items in the user\'s cart',
    parameters: {
        type: 'object',
        properties: {
        },
        required: [],
        additionalProperties: false,
    },
    strict: true,
};

/**
 * Function definition for adding items to cart
 * Defines required parameters for creating a new bouquet
 */
export const addCartItemFunctionDefinition: FunctionTool = {
    type: 'function',
    name: 'addCartItem',
    description: 'Adds an item to the user\'s cart',
    parameters: {
        type: 'object',
        properties: {
            bouquetSize: { type: 'integer', description: 'Size of the bouquet. 1 = small, 2 = medium, 3 = large' },
            flower: { type: 'string', description: 'Name of the flower, always in plural form (e.g. roses, NOT rose)' },
            color: { type: 'string', description: 'Color of the flower' },
        },
        required: ['bouquetSize', 'flower', 'color'],
        additionalProperties: false,
    },
    strict: true,
};

/**
 * Function definition for removing specific items from cart
 * Requires item ID for targeted deletion
 */
export const deleteCartItemFunctionDefinition: FunctionTool = {
    type: 'function',
    name: 'deleteCartItem',
    description: 'Deletes an item from the user\'s cart',
    parameters: {
        type: 'object',
        properties: {
            itemId: { type: 'integer', description: 'ID of the item to delete' },
        },
        required: ['itemId'],
        additionalProperties: false,
    },
    strict: true,
};

/**
 * Function definition for emptying the entire cart
 * Takes no parameters as it performs a complete clear operation
 */
export const clearCartFunctionDefinition: FunctionTool = {
    type: 'function',
    name: 'clearCart',
    description: 'Clears the user\'s cart',
    parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
    },
    strict: true,
};

/**
 * Collection of all function definitions for the AI assistant
 * Used to register available tools with OpenAI API
 */
export const functions: FunctionTool[] = [
    getCartItemsFunctionDefinition,
    addCartItemFunctionDefinition,
    deleteCartItemFunctionDefinition,
    clearCartFunctionDefinition,
];

/**
 * Retrieves all items from a user's shopping cart
 * @param db Database instance for data access
 * @param cartId Unique identifier for the user's cart
 * @returns Array of cart items with their details
 */
export async function getCartItems(db: Database, cartId: string) {
    const cartItems = await db.getCartItems(cartId);
    return cartItems;
}

/**
 * Parameter type for adding items to cart
 * Defines required fields for new bouquet creation
 */
export type AddCartItemParameters = {
    bouquetSize: number;
    flower: string;
    color: string;
}

/**
 * Adds a new bouquet to the user's shopping cart
 * Calculates price based on bouquet size
 * @param db Database instance for data access
 * @param cartId Unique identifier for the user's cart
 * @param parameters Details of the bouquet to add
 * @returns Success message or error if cart limit reached
 */
export async function addCartItem(db: Database, cartId: string, parameters: AddCartItemParameters) {
    let price = 0;
    switch (parameters.bouquetSize) {
        case 1:
            price = 15;
            break;
        case 2:
            price = 25;
            break;
        case 3:
            price = 35;
            break;
        default:
            throw new Error('Invalid bouquet size');
    }
    return await db.addCartItem({
        cartId,
        bouquetSize: parameters.bouquetSize,
        flower: parameters.flower,
        color: parameters.color,
        price,
    });
}

/**
 * Parameter type for deleting cart items
 * Requires item ID to identify specific item
 */
export type DeleteCartItemParameters = {
    itemId: number;
}

/**
 * Removes a specific item from the user's cart
 * @param db Database instance for data access
 * @param parameters Object containing item ID to delete
 */
export async function deleteCartItem(db: Database, parameters: DeleteCartItemParameters) {
    await db.deleteCartItem(parameters.itemId);
}

/**
 * Parameter type for clearing cart operations
 * Contains cart identifier
 */
export type ClearCartParameters = {
    cartId: string;
}

/**
 * Removes all items from a user's shopping cart
 * @param db Database instance for data access
 * @param cartId Unique identifier for the user's cart
 */
export async function clearCart(db: Database, cartId: string) {
    await db.clearCart(cartId);
}
