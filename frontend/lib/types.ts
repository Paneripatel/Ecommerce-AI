export type Category = "All" | "Laptops" | "Phones" | "Audio" | "Gaming" | "Smart Home";

export interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  original_price: number | null;
  category: Exclude<Category, "All">;
  rating: number;
  review_count: number;
  stock: number;
  features: string[];
  image_url: string;
  in_stock: boolean;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}
