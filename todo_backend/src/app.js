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

const express = require('express');
const { pool } = require('./db');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.get('/todos', async (req, res) => {
  const result = await pool.query('SELECT content FROM todos ORDER BY id');
  res.json(result.rows.map((row) => row.content));
});

app.post('/todos', async (req, res) => {
  const content = ((req.body && req.body.content) || '').trim();

  if (!content || content.length > 140) {
    console.log(`Rejected todo (${content.length} characters, limit is 140): "${content}"`);
    res.status(400).json({ error: 'content is required and must be at most 140 characters' });
    return;
  }

  console.log(`Accepted todo: "${content}"`);
  await pool.query('INSERT INTO todos (content) VALUES ($1)', [content]);
  res.status(201).json({ content });
});

module.exports = app;
