// app.js
//
// Microservicio nuevo del ejercicio 2.2: guarda las tareas del proyecto.
// todo_app (el que sirve el HTML) le habla a este servicio por HTTP,
// el navegador nunca le pega directo (no tiene Ingress).

const express = require('express');

const app = express();
app.use(express.json());

// En memoria por ahora: se pierde si el Pod se reinicia. El enunciado
// dice explicito que la base de datos real llega mas adelante.
let todos = [];

app.get('/todos', (req, res) => {
  res.json(todos);
});

app.post('/todos', (req, res) => {
  const content = ((req.body && req.body.content) || '').trim();

  if (!content || content.length > 140) {
    res.status(400).json({ error: 'content is required and must be at most 140 characters' });
    return;
  }

  todos.push(content);
  res.status(201).json({ content });
});

module.exports = app;
