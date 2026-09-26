"""Lab server: like `python3 -m http.server`, but tells the browser never to cache,
so edits to tokens.*.css, patch output, scripts and FAQ pages always show on reload.

    cd lab && python3 design/serve.py            # http://localhost:8765
    python3 design/serve.py 9000                 # other port
"""
import functools, http.server, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(NoCache, directory=ROOT)
    with http.server.ThreadingHTTPServer(("", PORT), handler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT} (no-cache)")
        httpd.serve_forever()
