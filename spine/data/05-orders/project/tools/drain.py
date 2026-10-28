"""SIGTERM in the middle of a request:  python tools/drain.py

Starts the app on port 8081, sends half a request, stops the app the way ECS
does (SIGTERM), then sends the rest. A graceful app answers the request it had
already accepted, then exits.
"""
import os
import socket
import subprocess
import sys
import time

app = subprocess.Popen([sys.executable, "-m", "book_shop.web"], text=True,
                       env={**os.environ, "PORT": "8081"},
                       stdout=subprocess.PIPE)
time.sleep(1)
client = socket.create_connection(("127.0.0.1", 8081))
# No blank line after the headers yet: the request is in flight.
client.sendall(b"GET /books/bk-1001 HTTP/1.1\r\nHost: shop\r\n")
print("client: half a request sent")
time.sleep(0.5)
app.terminate()  # SIGTERM
print("client: SIGTERM sent to the app")
time.sleep(0.5)
client.sendall(b"\r\n")
status = client.makefile("rb").readline().decode().strip()
print(f"client: the request finished: {status}")
print(f"client: the app exited with {app.wait(timeout=10)}")
print("app output:")
print(app.stdout.read(), end="")
