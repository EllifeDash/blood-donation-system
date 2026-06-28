const http = require('http');

const N8N_PORT = 5678;
const EXPRESS_PORT = 3000;
const PROXY_PORT = 8080;

const server = http.createServer((req, res) => {
  const target = req.url.startsWith('/api') ? EXPRESS_PORT : N8N_PORT;
  const options = {
    hostname: '127.0.0.1',
    port: target,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Bad Gateway', target, message: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`Proxy running on port ${PROXY_PORT}`);
  console.log(`  /webhook/* -> n8n (port ${N8N_PORT})`);
  console.log(`  /*         -> Express (port ${EXPRESS_PORT})`);
});
