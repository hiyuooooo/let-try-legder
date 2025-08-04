#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const WEB_DIR = path.join(__dirname, "dist", "web");

// MIME types
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  let filePath = path.join(WEB_DIR, req.url === "/" ? "index.html" : req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // File not found, serve index.html for SPA routing
        fs.readFile(path.join(WEB_DIR, "index.html"), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end("Server Error");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(content, "utf-8");
        });
      } else {
        res.writeHead(500);
        res.end("Server Error");
      }
    } else {
      const extname = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[extname] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`
🚀 Multi-Account Ledger - Local Server Started!

📱 Web Application: http://localhost:${PORT}
📁 Serving from: ${WEB_DIR}

Press Ctrl+C to stop the server
  `);
});
