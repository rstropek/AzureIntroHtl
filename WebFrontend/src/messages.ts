import { marked } from "marked";
import { CartItem } from "./api";

async function createMessageElement(message: string, type: "bot" | "user") {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", type);
  const messageContent = document.createElement("div");
  messageContent.classList.add("message-content");
  messageContent.innerHTML = await marked.parse(message);
  messageElement.appendChild(messageContent);
  return messageElement;
}

export async function createBotMessage(message: string) {
  return await createMessageElement(message, "bot");
}

export async function createUserMessage(message: string) {
  return await createMessageElement(message, "user");
}

export function createCartItem(cartItem: CartItem) {
  const cartItemElement = document.createElement("div");
  cartItemElement.classList.add("cart-item");
  const cartItemHeader = document.createElement("h3");

  let size: string = "";
  switch (cartItem.bouquetSize) {
    case 1:
      size = "Small";
      break;
    case 2:
      size = "Medium";
      break;
    case 3:
      size = "Large";
      break;
  }
  cartItemHeader.textContent = `${size} bouquet of ${cartItem.flower}`;
  cartItemElement.appendChild(cartItemHeader);

  const cartItemPrice = document.createElement("p");
  cartItemPrice.classList.add("item-price");
  cartItemPrice.textContent = `${cartItem.price.toFixed(2)}€`;
  cartItemElement.appendChild(cartItemPrice);

  const cartItemDescription = document.createElement("p");
  cartItemDescription.classList.add("item-description");
  cartItemDescription.textContent = `${size} bouquet of ${cartItem.color} ${cartItem.flower}`;
  cartItemElement.appendChild(cartItemDescription);

  return cartItemElement;
}
