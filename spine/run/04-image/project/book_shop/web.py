"""The shop's HTTP API, standard library only:  python -m book_shop.web

    GET /health          {"status": "ok"}: the load balancer's health check
    GET /books/<id>      the book's page from the catalog, or 404
"""
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from book_shop import catalog

BOOK = re.compile(r"^/books/(bk-\d{4})$")


class Shop(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.reply(200, {"status": "ok"})
        elif match := BOOK.match(self.path):
            try:
                self.reply(200, catalog.get_book(match[1]))
            except catalog.NotFound:
                self.reply(404, {"error": "no such book"})
        else:
            self.reply(404, {"error": "not found"})

    def reply(self, status: int, body: dict) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_request(self, code="-", size="-"):
        # One JSON line per request, on stdout: what the logs will collect.
        line = {"method": self.command, "path": self.path, "status": int(code)}
        print(json.dumps(line), flush=True)


def main() -> None:
    server = ThreadingHTTPServer(("", int(os.environ.get("PORT", "8080"))), Shop)
    print(json.dumps({"listening": server.server_port}), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
