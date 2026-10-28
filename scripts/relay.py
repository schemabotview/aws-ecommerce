"""A TCP relay: `python relay.py LISTEN_HOST LISTEN_PORT TARGET_HOST TARGET_PORT`.

Lets a Docker build step reach this machine's HTTPS proxy, which listens on the host's loopback where
a container cannot see it (toolchain.docker() starts it on the bridge gateway). Bytes only: TLS and
the proxy protocol pass through untouched.
"""
import socket
import sys
import threading


def pipe(a: socket.socket, b: socket.socket) -> None:
    try:
        while data := a.recv(65536):
            b.sendall(data)
    except OSError:
        pass
    finally:
        for s in (a, b):
            try:
                s.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass


def main(listen_host: str, listen_port: str, target_host: str, target_port: str) -> None:
    server = socket.create_server((listen_host, int(listen_port)))
    while True:
        client, _ = server.accept()
        try:
            upstream = socket.create_connection((target_host, int(target_port)))
        except OSError:
            client.close()
            continue
        threading.Thread(target=pipe, args=(client, upstream), daemon=True).start()
        threading.Thread(target=pipe, args=(upstream, client), daemon=True).start()


if __name__ == '__main__':
    main(*sys.argv[1:])
