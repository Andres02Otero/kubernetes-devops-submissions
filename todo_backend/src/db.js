// db.js
//
// Desde el ejercicio 2.8: las tareas ya no viven en un array en memoria,
// se guardan en Postgres (StatefulSet, ver manifests/postgres.yaml).
// pg.Pool() lee la conexion de las env vars estandar
// PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (definidas en
// manifests/deployment.yaml, con la password viniendo de un Secret).
// El timeout de conexion va por debajo del timeoutSeconds de las probes.

const { Pool } = require('pg');

const pool = new Pool({ connectionTimeoutMillis: 2000 });

// Sin este listener, un cliente inactivo que pierde la conexion (Postgres
// se reinicia) emite un 'error' sin manejar y tumba el proceso entero.
pool.on('error', (err) => {
    console.error('Postgres connection lost:', err.message);
});

// Desde el ejercicio 4.2 (igual que ping_pong en 4.1): ya no se espera a
// Postgres con reintentos ni se hace process.exit si no aparece. El
// servidor arranca siempre, la readinessProbe sobre /readyz decide si
// recibe trafico, y la tabla se crea la primera vez que hay conexion.
let schemaReady = false;

async function ensureSchema(force = false) {
    if (schemaReady && !force) {
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL
        )
    `);
    if (!schemaReady) {
        console.log('Connected to postgres and ready');
    }
    schemaReady = true;
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

module.exports = { pool, ensureSchema, isDatabaseReachable };
