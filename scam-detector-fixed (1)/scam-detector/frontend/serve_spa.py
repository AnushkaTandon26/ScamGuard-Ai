#!/usr/bin/env python3
"""
Simple HTTP server for serving the React SPA with proper routing.
All non-file requests are routed to index.html for React Router to handle.
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        filepath = Path(self.translate_path(self.path))
        if filepath.is_file():
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    build_dir = script_dir / "build"
    if not build_dir.exists():
        raise FileNotFoundError(f"Build directory not found: {build_dir}")

    os.chdir(build_dir)
    port = int(os.getenv("PORT", "3000"))
    server_address = ("", port)
    httpd = HTTPServer(server_address, SPAHandler)
    print(f"Serving React SPA on http://localhost:{port}")
    print(f"Serving from: {os.getcwd()}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
        sys.exit(0)
