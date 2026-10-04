// app.js
//
// Microservicio del ejercicio 2.2: guarda las tareas del proyecto.
// todo_app (el que sirve el HTML) le habla a este servicio por HTTP,
// el navegador nunca le pega directo (no tiene Ingress).
//
// Desde el ejercicio 2.8: las tareas se guardan en Postgres, no en
// memoria (ver db.js). El formato que devuelve GET /todos no cambio
// (array de strings), asi que todo_app no necesito ningun cambio.
//
// Desde el ejercicio 2.10: logueamos cada request a stdout. En
// Kubernetes stdout de un contenedor es lo que Alloy/Loki recolectan
// para Grafana, no hace falta escribir a ningun archivo ni configurar
// nada extra en la app para que los logs lleguen ahi.
//
// Desde el ejercicio 4.2: dos endpoints de salud con trabajos distintos.
//   - /healthz (livenessProbe): solo mira si la app esta "rota". Si
//     falla, Kubernetes reinicia el contenedor y el estado vuelve a sano.
//     No mira la base a proposito: si Postgres se cae, reiniciar el
//     backend no arregla nada y solo lo meteria en un bucle de reinicios.
//   - /readyz (readinessProbe): rota o sin conexion a Postgres = no
//     listo, el Service deja de mandarle trafico pero no lo reinicia.
// POST /break simula la falla que pide el ejercicio (boton en todo_app).

const express = require('express');
const { pool, ensureSchema, isDatabaseReachable } = require('./db');

const app = express();
app.use(express.json());

// Vive en memoria a proposito: al reiniciarse el contenedor vuelve a true,
// que es justo la "recuperacion" que el ejercicio espera ver.
let isHealthy = true;

app.use((req, res, next) => {
  // Las probes pegan cada pocos segundos; sin este filtro tapan los logs
  // utiles en Grafana/Loki (2.10).
  if (req.url !== '/healthz' && req.url !== '/readyz') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  }
  next();
});

app.get('/healthz', (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({ status: 'unhealthy' });
  }

  return res.status(200).json({ status: 'ok' });
});

app.get('/readyz', async (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({ status: 'unhealthy' });
  }

  if (!(await isDatabaseReachable())) {
    return res.status(500).json({ status: 'database not reachable' });
  }

  return res.status(200).json({ status: 'ok' });
});

app.post('/break', (req, res) => {
  isHealthy = false;
  console.log('App marked as broken on purpose: /healthz now answers 500 until the container restarts');
  res.status(200).json({ status: 'broken' });
});

// Mientras este "rota", la operacion normal se corta: /todos ya no responde.
app.use('/todos', (req, res, next) => {
  if (!isHealthy) {
    res.status(500).json({ error: 'the app is broken' });
    return;
  }
  next();
});

app.get('/todos', async (req, res) => {
  try {
    await ensureSchema();
    const result = await pool.query('SELECT content FROM todos ORDER BY id');
    res.json(result.rows.map((row) => row.content));
  } catch (err) {
    console.error(`GET /todos failed: ${err.message}`);
    res.status(503).json({ error: 'database not available' });
  }
});

app.post('/todos', async (req, res) => {
  const content = ((req.body && req.body.content) || '').trim();

  if (!content || content.length > 140) {
    console.log(`Rejected todo (${content.length} characters, limit is 140): "${content}"`);
    res.status(400).json({ error: 'content is required and must be at most 140 characters' });
    return;
  }

  try {
    await ensureSchema();
    await pool.query('INSERT INTO todos (content) VALUES ($1)', [content]);
  } catch (err) {
    console.error(`POST /todos failed: ${err.message}`);
    res.status(503).json({ error: 'database not available' });
    return;
  }

  console.log(`Accepted todo: "${content}"`);
  res.status(201).json({ content });
});

module.exports = app;
