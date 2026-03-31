const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PASSWORDS_FILE = path.join(__dirname, 'data', 'passwords.json');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // Handle POST /api/save-password
    if (req.method === 'POST' && req.url === '/api/save-password') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { username, newPassword } = JSON.parse(body);
                if (!username || !newPassword) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Missing username or password' }));
                }

                // Read passwords file
                fs.readFile(PASSWORDS_FILE, 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Failed to read database' }));
                    }

                    let json = JSON.parse(data);
                    const userIdx = json.users.findIndex(u => String(u.Username) === String(username));

                    if (userIdx > -1) {
                        json.users[userIdx].Password = newPassword;
                    } else {
                        json.users.push({ Username: username, Password: newPassword });
                    }

                    // Save back
                    fs.writeFile(PASSWORDS_FILE, JSON.stringify(json, null, 2), err => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ error: 'Failed to write database' }));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Handle Static Files (GET)
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Dalil Server running at http://localhost:${PORT}/`);
    console.log(`API at http://localhost:${PORT}/api/save-password`);
});
