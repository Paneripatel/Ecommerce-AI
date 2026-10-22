"""Single-request, catalog-grounded Gemini chat; no agent loops or vector DB."""
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class ChatError(Exception):
    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


def generate_reply(message: str, history: list, products: list) -> str:
    key = os.getenv("GOOGLE_API_KEY", "").strip()
    if not key:
        raise ChatError("The AI assistant is not configured. Add GOOGLE_API_KEY to backend/.env.", 503)

    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    if not model or not all(c.isalnum() or c in "-_." for c in model):
        raise ChatError("Invalid GEMINI_MODEL configuration.", 503)

    # The source of truth for recommendations is our local SQLite catalog.
    catalog = [{"id": p["id"], "name": p["name"], "brand": p["brand"],
                "price": p["price"], "category": p["category"],
                "description": p["description"], "features": p["features"],
                "stock": p["stock"]} for p in products]
    instruction = (
        "You are Ecommerce AI, a concise, helpful electronics shopping assistant. "
        "Recommend and compare ONLY products in the catalog below. "
        "Never invent products, prices, specifications, stock, promotions, or links. "
        "If nothing fits, say so and suggest alternatives from this catalog. "
        "Respect budget and preferences. Answer in plain text with short paragraphs. "
        "Never claim to place orders or access personal accounts. "
        "Catalog (JSON): " + json.dumps(catalog, ensure_ascii=False)
    )
    # Cap the history to avoid runaway context, and don't trust client-supplied roles/content.
    contents = []
    for item in history[-6:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role in ("user", "model") and isinstance(content, str) and content.strip():
            contents.append({"role": role, "parts": [{"text": content[:500]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})
    payload = {
        "systemInstruction": {"parts": [{"text": instruction}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 1600, "thinkingConfig": {"thinkingLevel": "low"}},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    req = Request(url, data=json.dumps(payload).encode("utf-8"), headers={
        "Content-Type": "application/json", "x-goog-api-key": key}, method="POST")
    try:
        # ONE API request per message; don't retry quota failures.
        with urlopen(req, timeout=40) as response:
            result = json.load(response)
    except HTTPError as exc:
        if exc.code == 429:
            raise ChatError("Gemini's request quota has been reached. Please try again after the quota resets.", 429) from exc
        if exc.code in (400, 404):
            raise ChatError("Gemini rejected the request. Check your API key and GEMINI_MODEL in backend/.env.", 502) from exc
        if exc.code in (401, 403):
            raise ChatError("Gemini API authentication failed. Check your API key and permissions.", 502) from exc
        raise ChatError("The AI provider could not complete this request.", 502) from exc
    except (URLError, TimeoutError, OSError) as exc:
        raise ChatError("The AI provider could not be reached. Please retry later.", 504) from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ChatError("The AI provider returned an unreadable response.", 502) from exc

    text = "\n".join(
        part.get("text", "")
        for candidate in result.get("candidates", [])[:1]
        for part in candidate.get("content", {}).get("parts", [])
        if isinstance(part.get("text"), str)
    ).strip()
    if not text:
        raise ChatError("Gemini returned no text. Try rephrasing your question.", 502)
    return text
