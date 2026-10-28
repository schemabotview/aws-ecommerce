"""The shop's HTTP API, standard library only:  python -m book_shop.web

    GET /health          {"status": "ok"}: the load balancer's health check
    GET /books/<id>      the book's page from the catalog, or 404
    POST /books/<id>/reviews/<review>/photo
                         a signed URL the browser PUTs the review's photo to
"""
import json
import os
import re
import signal
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from book_shop import catalog, uploads

BOOK = re.compile(r"^/books/(bk-\d{4})$")
PHOTO = re.compile(r"^/books/(bk-\d{4})/reviews/(r-\d+)/photo$")


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

    def do_POST(self):
        if match := PHOTO.match(self.path):
            self.reply(201, uploads.photo_url(match[1], match[2]))
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
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("", port), Shop)
    server.daemon_threads = False  # server_close() waits for requests in flight

    # ECS stops a task with SIGTERM, then SIGKILL 30 s later. On SIGTERM: stop
    # accepting, finish what is in flight, exit. By default Python dies at once.
    def stop(signum, frame):
        print(json.dumps({"stopping": signal.Signals(signum).name}), flush=True)
        threading.Thread(target=server.shutdown).start()

    signal.signal(signal.SIGTERM, stop)
    print(json.dumps({"listening": server.server_port}), flush=True)
    server.serve_forever()
    server.server_close()
    print(json.dumps({"stopped": "cleanly"}), flush=True)


if __name__ == "__main__":
    main()
