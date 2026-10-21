"""Minimal Flask API for catalog browsing and AI shopping advice."""
from pathlib import Path
from flask import Flask, jsonify, request
from dotenv import load_dotenv

from chatbot import ChatError, generate_reply
from database import all_products, initialize_database

load_dotenv(Path(__file__).resolve().parent / ".env")


def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
    app.json.sort_keys = False
    initialize_database()

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "ecommerce-ai"})

    @app.get("/api/products")
    def products():
        catalog = all_products()
        query = request.args.get("q", "").strip().lower()[:100]
        category = request.args.get("category", "all").strip().lower()[:30]
        sort = request.args.get("sort", "featured")
        if category != "all":
            catalog = [p for p in catalog if p["category"].lower() == category]
        if query:
            catalog = [p for p in catalog if query in " ".join(
                [p["name"], p["brand"], p["description"], p["category"],
                 " ".join(p["features"])]).lower()]
        if sort == "price-low":
            catalog.sort(key=lambda p: p["price"])
        elif sort == "price-high":
            catalog.sort(key=lambda p: -p["price"])
        elif sort == "rating":
            catalog.sort(key=lambda p: -p["rating"])
        return jsonify({"products": catalog, "count": len(catalog)})

    @app.post("/api/chat")
    def chat():
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Expected a JSON object."}), 400
        message = data.get("message")
        history = data.get("history", [])
        if not isinstance(message, str) or not message.strip() or len(message) > 500:
            return jsonify({"error": "Message must be between 1 and 500 characters."}), 400
        if not isinstance(history, list) or len(history) > 30:
            return jsonify({"error": "Invalid chat history."}), 400
        try:
            reply = generate_reply(message.strip(), history, all_products())
            return jsonify({"reply": reply})
        except ChatError as exc:
            return jsonify({"error": str(exc)}), exc.status
        except Exception:
            app.logger.exception("Unexpected chatbot failure")
            return jsonify({"error": "Something went wrong while processing your message."}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
