import { getCartItems, sendChatMessage } from "./api";
import "./index.css";
import { createBotMessage, createCartItem, createUserMessage } from "./messages";

document.addEventListener("DOMContentLoaded", async () => {
  const cartIconContainer = document.getElementById("cart-icon");
  const cartSection = document.getElementById("cartSection");
  if (cartIconContainer && cartSection) {
    cartIconContainer.addEventListener("click", () => {
      cartSection.classList.toggle("close-cart");
    });
  }

  const chatMessages = document.getElementById("chatMessages") as HTMLDivElement;
  chatMessages.appendChild(
    await createBotMessage("Hello! Welcome to Wonderful Flowers. I'd be happy to help you create the perfect bouquet. What's the occasion?")
  );

  const cartId = crypto.randomUUID();
  let previousId: string | undefined;

  const sendButton = document.getElementById("sendButton") as HTMLButtonElement;
  const chatInput = document.getElementById("chatInput") as HTMLInputElement;
  const cartItems = document.getElementById("cartItems") as HTMLDivElement;
  const cartTotal = document.getElementById("cartTotal") as HTMLSpanElement;
  const cartCount = document.getElementById("cartCount") as HTMLSpanElement;

  chatInput.focus();

  const sendMessage = async () => {
    const userMessage = chatInput.value;
    if (userMessage.trim()) {
      chatInput.disabled = true;
      try {
        chatInput.value = "";
        chatMessages.appendChild(await createUserMessage(userMessage));
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const { id, output } = await sendChatMessage(cartId, userMessage, previousId);
        previousId = id;
        chatMessages.appendChild(await createBotMessage(output));
        const items = await getCartItems(cartId);
        cartItems.innerHTML = "";
        items.forEach((item) => {
          cartItems.appendChild(createCartItem(item));
        });
        cartTotal.textContent = items.reduce((acc, item) => acc + item.price, 0).toFixed(2) + "€";
        cartCount.textContent = items.length.toString();
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.focus();
      } finally {
        chatInput.disabled = false;
      }
    }
  };

  sendButton.addEventListener("click", sendMessage);

  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
});
