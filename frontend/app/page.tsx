"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, Cpu, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

const categories: Category[] = ["All", "Laptops", "Phones", "Audio", "Gaming", "Smart Home"];
type Sort = "featured" | "price-low" | "price-high" | "rating";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<Sort>("featured");
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Cannot load products."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const term = query.toLowerCase().trim();
    const result = products.filter((product) => {
      const inCategory = category === "All" || product.category === category;
      const searchable = [
        product.name, product.brand, product.category,
        product.description, ...product.features,
      ].join(" ").toLowerCase();
      return inCategory && (!term || searchable.includes(term));
    });

    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [products, category, query, sort]);

  function openChat(productName?: string) {
    setQuestion(productName || null);
    setChatOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setSort("featured");
  }

  return (
    <main>
      <header className="site-header">
        <div className="container nav-inner">
          <a className="brand" href="#top">
            <span className="brand-icon"><Cpu size={20} /></span>
            <span>Ecommerce <em>AI</em></span>
          </a>
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#products">Explore products</a>
            <button type="button" onClick={() => openChat()}>AI assistant</button>
          </nav>
          <button className="nav-cta" type="button" onClick={() => openChat()}>
            <Sparkles size={16} /> Ask AI <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="hero-glow" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL TECH GUIDE</span>
            <h1>Find your next favorite <span>piece of tech.</span></h1>
            <p>
              Explore thoughtfully selected electronics. Ask our AI shopping assistant for
              clear comparisons, answers, and personalized recommendations.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#products">
                Explore collection <ArrowRight size={18} />
              </a>
              <button className="secondary-button" type="button" onClick={() => openChat()}>
                <Sparkles size={18} /> Talk to AI
              </button>
            </div>
            <div className="hero-proof">
              <span><span className="proof-star">★</span> Curated picks</span>
              <span className="dot-separator" />
              <span>No account required</span>
              <span className="dot-separator" />
              <span>AI-powered guidance</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="hero-device">✦</div>
            <div className="art-card art-card-one">
              <Sparkles size={18} />
              <div><strong>Ask anything</strong><span>"Best laptop for coding?"</span></div>
            </div>
            <div className="art-card art-card-two">
              <div className="art-small-icon">✓</div>
              <div><strong>Smart recommendations</strong><span>Matched to your needs</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="catalog-section">
        <div className="container">
          <div className="section-top">
            <div>
              <span className="section-kicker">DISCOVER</span>
              <h2>Explore our collection<span className="heading-dot">.</span></h2>
              <p>Great technology, made easier to find.</p>
            </div>
            <div className="results-total">{products.length} curated products</div>
          </div>

          <div className="catalog-controls">
            <div className="search-box">
              <Search size={19} />
              <input
                aria-label="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, brands, features..."
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="sort-box">
              <SlidersHorizontal size={17} />
              <label className="sr-only" htmlFor="sort-products">Sort products</label>
              <select
                id="sort-products"
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          <div className="category-tabs" role="group" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="catalog-summary">
            {!loading && !error ? `Showing ${visible.length} product${visible.length === 1 ? "" : "s"}` : ""}
          </div>

          {loading ? (
            <div className="feedback" role="status">Loading the catalog...</div>
          ) : error ? (
            <div className="feedback error-box" role="alert">
              <strong>Couldn’t load the products.</strong>
              <p>{error}</p>
              <p>Make sure the Flask backend is running on port 5000.</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="feedback">
              <Search size={28} />
              <h3>No matches found</h3>
              <p>Try another keyword or category.</p>
              <button className="secondary-button" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {visible.map((product) => (
                <ProductCard product={product} key={product.id} onAsk={openChat} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bottom-cta container">
        <div className="cta-icon"><Bot size={27} /></div>
        <div>
          <span className="section-kicker">YOUR SHOPPING SIDEKICK</span>
          <h2>Not sure what to choose?</h2>
          <p>
            Tell our AI assistant what you're looking for. We'll help you
            find a great fit in this collection.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={() => openChat()}>
          Start a conversation <ArrowRight size={18} />
        </button>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="brand footer-brand">
            <span className="brand-icon"><Cpu size={17} /></span>
            Ecommerce <em>AI</em>
          </span>
          <span>Made for smarter product discovery · Demo catalog, not a checkout store.</span>
          <span>Built with Next.js, Flask & Gemini</span>
        </div>
      </footer>

      {!chatOpen && (
        <button
          type="button"
          className="chat-fab"
          onClick={() => openChat()}
          aria-label="Open AI assistant"
        >
          <Sparkles size={21} /><span>Ask AI</span>
        </button>
      )}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} question={question} />
    </main>
  );
}
