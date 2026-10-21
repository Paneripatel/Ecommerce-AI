"""SQLite catalog storage. One short-lived connection per request."""
from contextlib import contextmanager
import json
from pathlib import Path
import sqlite3

DATA_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = DATA_DIR / "ecommerce.db"
SEED_PATH = DATA_DIR / "products.json"


@contextmanager
def connect():
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
    finally:
        connection.close()


def initialize_database():
    """Idempotent schema setup and sample-catalog seed (never deletes user data)."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                brand TEXT NOT NULL,
                description TEXT NOT NULL,
                price REAL NOT NULL,
                original_price REAL,
                category TEXT NOT NULL,
                rating REAL NOT NULL,
                review_count INTEGER NOT NULL,
                stock INTEGER NOT NULL,
                features TEXT NOT NULL,
                image_url TEXT NOT NULL
            )"""
        )
        if conn.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
            rows = json.loads(SEED_PATH.read_text(encoding="utf-8"))
            conn.executemany(
                """INSERT INTO products
                (name, brand, description, price, original_price, category,
                 rating, review_count, stock, features, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [(p["name"], p["brand"], p["description"], p["price"],
                  p.get("original_price"), p["category"], p["rating"],
                  p["review_count"], p["stock"], json.dumps(p["features"]),
                  p["image_url"]) for p in rows],
            )
        conn.commit()


def all_products():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM products ORDER BY rating DESC, name").fetchall()
    return [
        {**dict(row), "features": json.loads(row["features"]),
         "in_stock": row["stock"] > 0}
        for row in rows
    ]
