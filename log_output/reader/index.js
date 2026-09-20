const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join('/usr/src/app/files', 'status.log');

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

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(readLastLine());
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
