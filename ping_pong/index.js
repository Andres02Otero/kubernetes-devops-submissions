const http = require('http');

// Contador en memoria: vive mientras el proceso este vivo, se reinicia
// si el Pod se recrea. Es justo lo que pide el ejercicio 1.9.
let counter = 0;

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/pingpong') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`pong ${counter}`);
        counter += 1;
        return;
    }

    res.writeHead(404);
    res.end();
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
