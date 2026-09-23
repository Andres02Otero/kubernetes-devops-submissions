// app.js
//
// Arma la app de Express. La ruta raiz devuelve HTML (requisito 1.5),
// con la imagen cacheada (1.12) y el formulario + lista de tareas.
//
// Desde el ejercicio 2.2: las tareas ya no son hardcodeadas (1.13) ni se
// agregan solo con JS del lado del cliente. El navegador le habla a
// todo_app (GET / y POST /todos, server-side rendering) y es todo_app
// quien internamente consulta/crea las tareas en todo-backend-svc.

const express = require('express');
const { ensureImage, imageExists, getImagePath } = require('./imageCache');

const app = express();
app.use(express.urlencoded({ extended: true }));

const TODO_BACKEND_URL = 'http://todo-backend-svc:2345/todos';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchTodos() {
  try {
    const response = await fetch(TODO_BACKEND_URL);
    return await response.json();
  } catch (err) {
    console.error('Error consultando todo-backend-svc:', err);
    return [];
  }
}

app.get('/', async (req, res) => {
  try {
    await ensureImage();
  } catch (err) {
    console.error('Error obteniendo la imagen:', err);
  }

  const imageTag = imageExists()
    ? '<img src="/image" alt="Imagen aleatoria" />'
    : '<p>No se pudo cargar la imagen todavia.</p>';

  const todos = await fetchTodos();
  const todosList = todos.map((todo) => `<li>${escapeHtml(todo)}</li>`).join('\n');

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>To do App</title>
        <style>
          body { font-family: sans-serif; max-width: 500px; margin: 2rem auto; text-align: center; }
          img { max-width: 400px; border-radius: 8px; }
          input[type="text"] { padding: 0.5rem; border: 2px solid #2e7d32; border-radius: 4px; width: 60%; }
          button { padding: 0.5rem 1rem; border: none; border-radius: 4px; background: #2e7d32; color: white; cursor: pointer; }
          ul { list-style: none; padding: 0; text-align: left; }
          li { background: #f5f5f5; border-left: 4px solid #2e7d32; padding: 0.5rem 1rem; margin: 0.5rem 0; }
        </style>
      </head>
      <body>
        <h1>To do App</h1>
        ${imageTag}

        <form action="/todos" method="post">
          <input type="text" name="content" maxlength="140" placeholder="Enter a new todo (max 140 characters)" required />
          <button type="submit">Send</button>
        </form>

        <h2>Todos</h2>
        <ul>
          ${todosList}
        </ul>
      </body>
    </html>
  `);
});

app.post('/todos', async (req, res) => {
  try {
    await fetch(TODO_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: req.body.content }),
    });
  } catch (err) {
    console.error('Error creando la tarea en todo-backend-svc:', err);
  }

  res.redirect('/');
});

app.get('/image', (req, res) => {
  if (!imageExists()) {
    res.status(404).send('No image cached yet');
    return;
  }

  res.sendFile(getImagePath());
});

module.exports = app;
