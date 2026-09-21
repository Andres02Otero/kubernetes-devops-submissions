const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join('/usr/src/app/files', 'status.log');

// Desde el ejercicio 1.11: el contador de ping-pong vive en un
// PersistentVolume compartido con la app ping_pong (montado en
// /usr/src/app/counter), separado del emptyDir de status.log.
const COUNT_FILE = path.join('/usr/src/app/counter', 'count.txt');

// Devuelve la ultima linea escrita por el contenedor "writer" (el status
// mas reciente), no el archivo completo.
function readLastLine() {
    if (!fs.existsSync(FILE_PATH)) {
        return 'waiting for the writer container to produce the first line...';
    }

    const content = fs.readFileSync(FILE_PATH, 'utf-8').trim();
    const lines = content.split('\n');
    return lines[lines.length - 1];
}

function readPingPongCount() {
    if (!fs.existsSync(COUNT_FILE)) {
        return 0;
    }

    const parsed = parseInt(fs.readFileSync(COUNT_FILE, 'utf-8').trim(), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

const server = http.createServer((req, res) => {
    const status = readLastLine();
    const count = readPingPongCount();

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${status}\nPing / Pongs: ${count}`);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
