# Ecommerce AI

A streamlined **AI-powered electronics catalog** built with **Next.js, TypeScript, Flask, SQLite, and Google Gemini**. Browse 15 demo products, search by brand/specification, filter categories, and ask a chatbot for catalog-grounded product comparisons and recommendations.


## What it does

- Responsive dark-themed storefront with product cards, images, prices, and key features
- Instant search, category filters, price/rating sorting, and an AI chat panel
- REST API with SQLite-backed sample product catalog
- Catalog-grounded Gemini assistant with budget and product-comparison support
- Useful errors for an unavailable backend, missing API key, and exhausted Gemini quota

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, CSS, Lucide icons |
| Backend | Python 3.12+, Flask |
| Database | SQLite (built into Python) |
| AI | Google Gemini via REST API (one request per message) |

## Project structure

```text
 ecommerce-ai/
 ├── frontend/
 │   ├── app/                 # Single-page storefront and styling
 │   ├── components/          # ChatPanel and ProductCard
 │   ├── lib/                 # API client and TypeScript types
 │   ├── next.config.js       # Proxies /api to Flask (no CORS setup)
 │   ├── package.json
 │   └── tsconfig.json
 ├── backend/
 │   ├── app.py               # Three simple API endpoints
 │   ├── database.py          # SQLite setup and product retrieval
 │   ├── chatbot.py           # Gemini integration
 │   ├── data/products.json   # Original demo catalog (15 products)
 │   ├── tests/              # API and Gemini mock tests
 │   ├── requirements.txt
 │   └── .env.example
 ├── .gitignore
 └── LICENSE
```

## Quick start (Mac / Linux)

Requires **Python 3.12+** and **Node.js 20+**. Use two terminals.

**Terminal 1 — backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `backend/.env` and set `GOOGLE_API_KEY` using [Google AI Studio](https://aistudio.google.com/api-keys). Leave `GEMINI_MODEL=gemini-3.8-flash` or replace it with a model available to your key. The products work without an AI key; chat returns a helpful setup error until the key is configured.

```bash
python app.py
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The frontend automatically forwards `/api` requests to **http://127.0.0.1:5000**, so you don't need a browser API URL or CORS configuration. The SQLite database is automatically created and seeded on first startup.

### API endpoints

| Method | URL | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/products` | Product list (`q`, `category`, and `sort` optional) |
| POST | `/api/chat` | `{"message":"...", "history":[]}` returns `{"reply":"..."}` |

Example API test:

```bash
curl http://127.0.0.1:5000/api/health
curl 'http://127.0.0.1:5000/api/products?category=Laptops'
```

## Tests

From `backend/` with dependencies installed:

```bash
python -m unittest discover -s tests -v
```

From `frontend/`:

```bash
npm run typecheck
npm run build
```

The backend tests use a **mock** response for Gemini, so they don't spend API quota. A live Gemini response requires a valid API key, model access, network connection, and sufficient quota. Free-tier limits can prevent chat responses even when the catalog works.


