#!/usr/bin/env python

import socket
import http
import http.server

IP_ADDRESS = socket.gethostbyname(socket.gethostname())
TLD = socket.getfqdn().split(".")[-1]

PAC_TEMPLATE = """
function FindProxyForURL(url, host) {{
    if (isInNet(host, "{ip}", "255.255.0.0") || host.endsWith("{tld}") || !host.includes(".")) {{
        return "SOCKS5 {proxy_host}:1080"
    }}

    return "DIRECT";
}}
"""


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-type", "application/x-ns-proxy-autoconfig")
        self.end_headers()

        pac = PAC_TEMPLATE.format(
            ip=IP_ADDRESS, tld=TLD, proxy_host=self.headers["Host"].split(":")[0]
        )

        self.wfile.write(pac.encode())


def main():
    httpd = http.server.HTTPServer(("", 80), Handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
