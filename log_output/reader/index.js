const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join('/usr/src/app/files', 'status.log');

// Desde el ejercicio 2.1: el contador de ping-pong ya no se lee de un
// volumen compartido, se pide por HTTP al Service interno de ping-pong
// (comunicacion pod-a-pod via el DNS de Kubernetes: <service>:<port>).
const PING_PONG_URL = 'http://ping-pong-svc:3001/pings';

// Desde el ejercicio 2.5: el ConfigMap log-output-config se monta como
// archivo (information.txt) y ademas se pasa como env var (MESSAGE).
const CONFIG_FILE_PATH = path.join('/usr/src/app/config', 'information.txt');

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

function readConfigFile() {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        return '';
    }

    return fs.readFileSync(CONFIG_FILE_PATH, 'utf-8').trim();
}

async function fetchPingPongCount() {
    try {
        const response = await fetch(PING_PONG_URL);
        const parsed = parseInt((await response.text()).trim(), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    } catch (err) {
        console.error('Error consultando ping-pong-svc:', err);
        return 0;
    }
}

const server = http.createServer(async (req, res) => {
    const fileContent = readConfigFile();
    const message = process.env.MESSAGE || '';
    const status = readLastLine();
    const count = await fetchPingPongCount();

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`file content: ${fileContent}\nenv variable: MESSAGE=${message}\n${status}\nPing / Pongs: ${count}`);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
