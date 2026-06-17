import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8080);

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('PortMasters 2 server scaffold OK');
});

server.listen(PORT, () => {
  console.log(`PortMasters 2 server listening on http://localhost:${PORT}`);
});
