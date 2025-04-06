declare global {
  const __SERVICE_BASE__: string;
}

export async function sendChatMessage(
  cartId: string,
  message: string,
  previousId?: string
): Promise<{ id: string; output: string }> {
  const response = await fetch(`${__SERVICE_BASE__}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cartId,
      input: message,
      previousId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send chat message");
  }

  return response.json();
}

export type CartItem = {
  id?: number;
  cartId: string;
  bouquetSize: number;
  flower: string;
  color: string;
  price: number;
};

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  const response = await fetch(`${__SERVICE_BASE__}/cart?id=${cartId}`);
  return response.json();
}

