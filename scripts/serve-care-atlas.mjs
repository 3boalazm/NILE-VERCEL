import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

// Review-only static server: public assets only, no auth/commerce/database.
// The concept is also available in public/ for the next normal Next build.
const root = resolve("public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
const server = createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self'; font-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'",
  );
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const url = new URL(req.url, "http://preview.invalid");
    if (url.pathname === "/") {
      res
        .writeHead(302, {
          Location: "/concepts/care-atlas/index.html" + url.search,
        })
        .end();
      return;
    }
    const file = resolve(root, "." + decodeURIComponent(url.pathname));
    const type = types[extname(file)];
    if (!file.startsWith(root + sep) || !type) {
      res.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": info.size });
    if (req.method === "HEAD") res.end();
    else
      createReadStream(file)
        .on("error", () => res.destroy())
        .pipe(res);
  } catch {
    res.writeHead(404).end();
  }
});
server.listen(Number(process.env.PORT || 3100), "0.0.0.0", () =>
  console.log(
    "Care Atlas direction study: http://0.0.0.0:" + (process.env.PORT || 3100),
  ),
);
