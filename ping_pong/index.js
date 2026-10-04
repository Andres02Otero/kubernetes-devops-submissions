const http = require('http');
const { Pool } = require('pg');

// Desde el ejercicio 2.7: el contador ya no vive en memoria (2.1), se
// guarda en Postgres (StatefulSet, ver manifests/postgres.yaml) para
// sobrevivir a que el Pod se reinicie. pg.Pool() lee la conexion de las
// env vars estandar PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (definidas
// en manifests/rollout.yaml), no hace falta armar el connection string.
// El timeout de conexion va por debajo del timeoutSeconds de la
// readinessProbe: si Postgres no contesta, /healthz debe responder 500
// antes de que el kubelet de la prueba por perdida.
const pool = new Pool({ connectionTimeoutMillis: 2000 });

// Sin este listener, un cliente inactivo que pierde la conexion (Postgres
// se reinicia) emite un 'error' sin manejar y tumba el proceso entero.
pool.on('error', (err) => {
    console.error('Postgres connection lost:', err.message);
});

// Desde el ejercicio 4.1 la app ya no espera a Postgres antes de arrancar
// (antes reintentaba 10 veces y hacia process.exit, lo que terminaba en
// CrashLoopBackOff). Ahora el servidor arranca siempre y es la
// readinessProbe sobre /healthz la que le dice a Kubernetes si el Pod puede
// recibir trafico. La tabla se crea la primera vez que hay conexion.
let schemaReady = false;

async function ensureSchema(force = false) {
    if (schemaReady && !force) {
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS pingpong_counter (
            id INTEGER PRIMARY KEY DEFAULT 1,
            count INTEGER NOT NULL DEFAULT 0
        )
    `);
    await pool.query(`
        INSERT INTO pingpong_counter (id, count) VALUES (1, 0)
        ON CONFLICT (id) DO NOTHING
    `);
    if (!schemaReady) {
        console.log('Connected to postgres and ready');
    }
    schemaReady = true;
}

// Incrementa el contador de forma atomica (una sola sentencia SQL) y
// devuelve el valor DE ANTES de incrementar, para no cambiar el
// comportamiento de siempre: la primera respuesta sigue siendo "pong 0".
async function incrementAndGetPrevious() {
    await ensureSchema();
    const result = await pool.query(`
        UPDATE pingpong_counter SET count = count + 1 WHERE id = 1
        RETURNING count - 1 AS previous_count
    `);
    return result.rows[0].previous_count;
}

async function getCurrentCount() {
    await ensureSchema();
    const result = await pool.query('SELECT count FROM pingpong_counter WHERE id = 1');
    return result.rows[0].count;
}

// "Listo" = hay conexion real con la base y la tabla existe. Se fuerza
// el CREATE ... IF NOT EXISTS en cada chequeo (es barato) en vez de
// confiar en schemaReady: si Postgres vuelve con la base vacia (disco
// nuevo, restore), la tabla se recrea sola en el siguiente chequeo
// (bug visto al corregir la persistencia en el ejercicio 4.2).
async function isDatabaseReachable() {
    try {
        await ensureSchema(true);
        return true;
    } catch (err) {
        console.error(`Postgres not reachable: ${err.message}`);
        return false;
    }
}

function sendText(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'text/plain' });
    res.end(body);
}

const server = http.createServer(async (req, res) => {
    // Endpoint de la readinessProbe (ver manifests/rollout.yaml).
    if (req.method === 'GET' && req.url === '/healthz') {
        const reachable = await isDatabaseReachable();
        sendText(res, reachable ? 200 : 500, reachable ? 'ok' : 'database not reachable');
        return;
    }

    // Desde el ejercicio 3.4 la app responde en / y no sabe nada de
    // /pingpong: esa ruta solo existe en el cluster y el HTTPRoute la
    // reescribe a / antes de llegar aqui (ver log_output/manifests-gke/route.yaml).
    // El health check del balanceador ya no puede usar /, porque cada
    // chequeo incrementaria el contador; usa /pings (ver manifests-gke/healthcheck.yaml).
    try {
        if (req.method === 'GET' && req.url === '/') {
            const previousCount = await incrementAndGetPrevious();
            sendText(res, 200, `pong ${previousCount}`);
            return;
        }

        if (req.method === 'GET' && req.url === '/pings') {
            const count = await getCurrentCount();
            sendText(res, 200, String(count));
            return;
        }
    } catch (err) {
        // Sin base no hay contador que dar: 503 en vez de dejar la request colgada.
        console.error(`Request ${req.url} failed: ${err.message}`);
        sendText(res, 503, 'database not available');
        return;
    }

    res.writeHead(404);
    res.end();
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
