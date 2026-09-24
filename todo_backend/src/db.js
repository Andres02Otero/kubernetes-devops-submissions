// db.js
//
// Desde el ejercicio 2.8: las tareas ya no viven en un array en memoria,
// se guardan en Postgres (StatefulSet, ver manifests/postgres.yaml).
// pg.Pool() sin argumentos lee la conexion de las env vars estandar
// PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE (definidas en
// manifests/deployment.yaml, con la password viniendo de un Secret).

const { Pool } = require('pg');

const pool = new Pool();

// Mismo hint que en ping_pong (2.7): esperar con reintentos a que
// Postgres este disponible antes de aceptar requests.
async function waitForDatabase(retries = 10, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS todos (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL
                )
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

module.exports = { pool, waitForDatabase };
