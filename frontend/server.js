const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let reqUrl = decodeURIComponent(req.url.split('?')[0]);
    if (reqUrl === '/') reqUrl = '/index.html';
    
    let safePath = reqUrl.replace(/^[\/\\]+/, '');
    let filePath = path.join(__dirname, safePath);

    console.log('[SERVER] Request:', reqUrl, '-> Path:', filePath);

    let extname = String(path.extname(filePath)).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.log('[SERVER] Error reading file:', error.message);
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 File Not Found</h1><p>Requested: ' + reqUrl + '</p><p>Error: ' + error.message + '</p>');
        } else {
            console.log('[SERVER] Success 200:', filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});
