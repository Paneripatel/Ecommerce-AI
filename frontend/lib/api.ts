import { ChatMessage, Product } from "./types";

async function jsonRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...options });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || `Request failed (${response.status}).`);
  }
  return result as T;
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await jsonRequest<{ products: Product[] }>("/api/products");
  return data.products;
}

export async function askAssistant(message: string, history: ChatMessage[]): Promise<string> {
  const data = await jsonRequest<{ reply: string }>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: history.slice(-6) }),
  });
  return data.reply;
}
