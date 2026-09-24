// app.js
//
// Microservicio del ejercicio 2.2: guarda las tareas del proyecto.
// todo_app (el que sirve el HTML) le habla a este servicio por HTTP,
// el navegador nunca le pega directo (no tiene Ingress).
//
// Desde el ejercicio 2.8: las tareas se guardan en Postgres, no en
// memoria (ver db.js). El formato que devuelve GET /todos no cambio
// (array de strings), asi que todo_app no necesito ningun cambio.

const express = require('express');
const { pool } = require('./db');

const app = express();
app.use(express.json());

app.get('/todos', async (req, res) => {
  const result = await pool.query('SELECT content FROM todos ORDER BY id');
  res.json(result.rows.map((row) => row.content));
});

app.post('/todos', async (req, res) => {
  const content = ((req.body && req.body.content) || '').trim();

  if (!content || content.length > 140) {
    res.status(400).json({ error: 'content is required and must be at most 140 characters' });
    return;
  }

  await pool.query('INSERT INTO todos (content) VALUES ($1)', [content]);
  res.status(201).json({ content });
});

module.exports = app;
