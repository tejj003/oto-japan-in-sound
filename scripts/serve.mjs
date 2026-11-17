import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const portFlag = process.argv.indexOf('--port');
const port = Number(portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Choose a port between 1 and 65535.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Content-Length': info.size
    });
    if (req.method === 'HEAD') res.end();
    else {
      const stream = createReadStream(file);
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    }
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404);
    res.end(error instanceof URIError ? 'Invalid path' : 'Not found');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is in use. Try npm run dev -- --port ${port + 1}.`
    : error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log(`Oto is ready at http://localhost:${port}`));
