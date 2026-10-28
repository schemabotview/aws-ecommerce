import json
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

from book_shop.web import Shop


@pytest.fixture
def url(aws):
    server = ThreadingHTTPServer(("127.0.0.1", 0), Shop)  # 0: any free port
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{server.server_port}"
    server.shutdown()


def get(url):
    try:
        with urllib.request.urlopen(url) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def test_health(url):
    assert get(url + "/health") == (200, {"status": "ok"})


def test_a_book(url):
    status, body = get(url + "/books/bk-1001")
    assert (status, body["id"]) == (200, "bk-1001")


def test_an_unknown_book_is_404(url):
    assert get(url + "/books/bk-9999") == (404, {"error": "no such book"})
