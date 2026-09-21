const http = require('http');
const fs = require('fs');
const path = require('path');

// Desde el ejercicio 1.11: el contador se persiste en un PersistentVolume
// compartido con log_output (montado en /usr/src/app/counter), asi
// sobrevive a que el Pod se recree - antes solo vivia en memoria.
const COUNT_FILE = path.join('/usr/src/app/counter', 'count.txt');

function readCounter() {
    if (!fs.existsSync(COUNT_FILE)) {
        return 0;
    }

    const parsed = parseInt(fs.readFileSync(COUNT_FILE, 'utf-8').trim(), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

let counter = readCounter();

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/pingpong') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`pong ${counter}`);
        counter += 1;
        fs.writeFileSync(COUNT_FILE, String(counter));
        return;
    }

    res.writeHead(404);
    res.end();
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
