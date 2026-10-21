"""Run with: python -m unittest discover -s tests -v"""
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import create_app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = create_app().test_client()

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["status"], "ok")

    def test_catalog_seed(self):
        response = self.client.get("/api/products")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["count"], 15)

    def test_search_and_filter(self):
        response = self.client.get("/api/products?q=MacBook&category=Laptops")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["count"], 1)
        self.assertIn("MacBook", response.json["products"][0]["name"])

    def test_sort(self):
        p = self.client.get("/api/products?sort=price-low").json["products"]
        self.assertEqual([x["price"] for x in p], sorted(x["price"] for x in p))

    def test_bad_message(self):
        response = self.client.post("/api/chat", json={"message": "", "history": []})
        self.assertEqual(response.status_code, 400)

    def test_missing_key(self):
        with patch.dict(os.environ, {"GOOGLE_API_KEY": ""}):
            response = self.client.post("/api/chat", json={"message": "hello", "history": []})
        self.assertEqual(response.status_code, 503)

    def test_chat_response_mock(self):
        with patch("app.generate_reply", return_value="Try the Dell XPS 13 Plus.") as reply:
            response = self.client.post("/api/chat", json={"message": "laptop?", "history": []})
        self.assertEqual(response.status_code, 200)
        self.assertIn("Dell", response.json["reply"])
        self.assertEqual(reply.call_count, 1)


if __name__ == "__main__":
    unittest.main()
