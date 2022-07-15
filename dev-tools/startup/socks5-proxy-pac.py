#!/usr/bin/env python

import socket
import http
import http.server

HOSTNAME = socket.gethostname()
IP_ADDRESS = socket.gethostbyname(HOSTNAME)


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-type", "application/x-ns-proxy-autoconfig")
        self.end_headers()

        self.wfile.write(
            f"""
        function FindProxyForURL(url, host) {{
            if (isInNet(host, "{IP_ADDRESS}", "255.255.0.0")) {{
                return "SOCKS5 {self.headers.get("Host").split(":")[0]}:1080"
            }}

            return "DIRECT";
        }}
        """.encode()
        )


def main():
    httpd = http.server.HTTPServer(("", 80), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
