// Simple proxy server to bypass CORS for FTC API
const http = require('http');
const https = require('https');

const PORT = 3001;
const FTC_API_BASE = 'ftc-api.firstinspires.org';

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle GET requests to /api/*
  if (!req.url.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Extract the FTC API path
  const ftcPath = req.url.replace('/api', '');
  
  // Get Authorization header from request
  const authHeader = req.headers.authorization;

  const options = {
    hostname: FTC_API_BASE,
    path: ftcPath,
    method: 'GET',
    headers: {
      'Authorization': authHeader || '',
      'Content-Type': 'application/json'
    }
  };

  // Make request to FTC API
  const apiReq = https.request(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    apiRes.pipe(res);
  });

  apiReq.on('error', (error) => {
    console.error('Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Proxy error' }));
  });

  apiReq.end();
});

server.listen(PORT, () => {
  console.log(`\n🔧 FTC API Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding requests to https://${FTC_API_BASE}\n`);
});
