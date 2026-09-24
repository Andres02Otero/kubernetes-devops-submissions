const http = require('http');
const { Pool } = require('pg');

// Desde el ejercicio 2.7: el contador ya no vive en memoria (2.1), se
// guarda en Postgres (StatefulSet, ver manifests/postgres.yaml) para
// sobrevivir a que el Pod se reinicie. pg.Pool() sin argumentos lee la
// conexion de las env vars estandar PGHOST/PGPORT/PGUSER/PGPASSWORD/
// PGDATABASE (definidas en manifests/deployment.yaml), no hace falta
// armar el connection string a mano.
const pool = new Pool();

// El hint del ejercicio advierte que hay que asegurarse de que Postgres
// este disponible antes de conectar - por eso reintentamos con espera en
// vez de fallar de una vez si el StatefulSet todavia esta arrancando.
async function waitForDatabase(retries = 10, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
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
            console.log('Connected to postgres and ready');
            return;
        } catch (err) {
            console.error(`Postgres not ready yet (intento ${attempt}/${retries}): ${err.message}`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw new Error('Could not connect to postgres after multiple retries');
}

// Incrementa el contador de forma atomica (una sola sentencia SQL) y
// devuelve el valor DE ANTES de incrementar, para no cambiar el
// comportamiento de siempre: la primera respuesta sigue siendo "pong 0".
async function incrementAndGetPrevious() {
    const result = await pool.query(`
        UPDATE pingpong_counter SET count = count + 1 WHERE id = 1
        RETURNING count - 1 AS previous_count
    `);
    return result.rows[0].previous_count;
}

async function getCurrentCount() {
    const result = await pool.query('SELECT count FROM pingpong_counter WHERE id = 1');
    return result.rows[0].count;
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/pingpong') {
        const previousCount = await incrementAndGetPrevious();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`pong ${previousCount}`);
        return;
    }

    if (req.method === 'GET' && req.url === '/pings') {
        const count = await getCurrentCount();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(String(count));
        return;
    }

    res.writeHead(404);
    res.end();
});

const PORT = process.env.PORT || 3000;

waitForDatabase()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server started in port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
