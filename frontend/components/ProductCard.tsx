"use client";

import { useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import type { Product } from "@/lib/types";

function fallbackIcon(category: Product["category"]): string {
  return {
    Laptops: "💻",
    Phones: "📱",
    Audio: "🎧",
    Gaming: "🎮",
    "Smart Home": "🏠",
  }[category];
}

interface ProductCardProps {
  product: Product;
  onAsk: (name: string) => void;
}

export function ProductCard({ product, onAsk }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasDiscount = product.original_price !== null && product.original_price > product.price;

  return (
    <article className="product-card">
      <div className="product-image">
        {imageFailed ? (
          <span className="image-fallback" aria-hidden="true">
            {fallbackIcon(product.category)}
          </span>
        ) : (
          // External demo images; show an emoji fallback if unavailable.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        {hasDiscount && <span className="sale-badge">Sale</span>}
        <span className="category-tag">{product.category}</span>
      </div>

      <div className="product-body">
        <div className="product-meta">
          <span>{product.brand}</span>
          <span className="rating"><Star size={13} fill="currentColor" /> {product.rating.toFixed(1)}</span>
        </div>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="feature-list">
          {product.features.slice(0, 2).map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
        <div className="product-bottom">
          <div className="price-block">
            <span className="price">
              ${product.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="old-price">
                ${product.original_price?.toLocaleString("en-US")}
              </span>
            )}
          </div>
          <button
            type="button"
            className="ask-product"
            onClick={() => onAsk(product.name)}
            aria-label={`Ask AI about ${product.name}`}
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
