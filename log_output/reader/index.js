const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join('/usr/src/app/files', 'status.log');

// Desde el ejercicio 2.1: el contador de ping-pong ya no se lee de un
// volumen compartido, se pide por HTTP al Service interno de ping-pong
// (comunicacion pod-a-pod via el DNS de Kubernetes: <service>:<port>).
// Desde el ejercicio 5.7 la URL es configurable: con ping-pong en Knative
// se llama por su nombre DNS completo (ping-pong.exercises.svc.cluster.local,
// ver manifests-knative/). Por defecto, el Service de siempre.
const PING_PONG_URL = process.env.PING_PONG_URL || 'http://ping-pong-svc:3001/pings';

// Desde el ejercicio 5.3: el saludo viene del servicio greeter. Se llama a
// greeter-svc y no a una version concreta: Istio (HTTPRoute + waypoint)
// decide si responde v1 o v2.
// Vacia (GREETER_URL="") = sin greeter: la linea del saludo no se muestra
// (el cluster de Knative de 5.7 no tiene el greeter de 5.3).
const GREETER_URL = process.env.GREETER_URL ?? 'http://greeter-svc';

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

// Desde el ejercicio 4.1: a diferencia de fetchPingPongCount (que cae a 0
// para no romper la pagina), aqui cualquier fallo cuenta como "no listo".
// El timeout queda por debajo del timeoutSeconds de la readinessProbe.
async function canReachPingPong() {
    try {
        const response = await fetch(PING_PONG_URL, { signal: AbortSignal.timeout(2000) });
        return response.ok;
    } catch (err) {
        console.error(`ping-pong-svc not reachable: ${err.message}`);
        return false;
    }
}

// Si el greeter falla la pagina sigue funcionando; no afecta la
// readinessProbe, que solo depende de ping-pong (4.1).
async function fetchGreeting() {
    try {
        const response = await fetch(GREETER_URL, { signal: AbortSignal.timeout(2000) });
        if (!response.ok) {
            return `greeter answered ${response.status}`;
        }
        return (await response.text()).trim();
    } catch (err) {
        console.error('Error consultando greeter-svc:', err.message);
        return 'greeter not available';
    }
}

const server = http.createServer(async (req, res) => {
    // Endpoint de la readinessProbe del contenedor reader (ver manifests/deployment.yaml).
    if (req.method === 'GET' && req.url === '/healthz') {
        const reachable = await canReachPingPong();
        res.writeHead(reachable ? 200 : 500, { 'Content-Type': 'text/plain' });
        res.end(reachable ? 'ok' : 'ping-pong not reachable');
        return;
    }

    const fileContent = readConfigFile();
    const message = process.env.MESSAGE || '';
    const status = readLastLine();
    const count = await fetchPingPongCount();
    const greeting = GREETER_URL ? await fetchGreeting() : null;

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`file content: ${fileContent}\nenv variable: MESSAGE=${message}\n${status}\nPing / Pongs: ${count}${greeting === null ? '' : `\ngreetings: ${greeting}`}`);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
