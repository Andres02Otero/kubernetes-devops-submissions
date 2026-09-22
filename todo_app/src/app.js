// app.js
//
// Arma la app de Express. La ruta raiz devuelve HTML (requisito 1.5),
// con la imagen cacheada (1.12) y ahora el formulario + lista de tareas
// hardcodeadas del ejercicio 1.13. El boton "Send" agrega la tarea a la
// lista visible con JS del lado del cliente, pero sigue sin persistencia
// real: nada se manda al backend, se pierde al recargar. El enunciado de
// 1.13 solo exige que no haga falta enviarla todavia, no que el boton
// sea inerte - el CRUD real (con backend) llega en un ejercicio posterior.

const express = require('express');
const { ensureImage, imageExists, getImagePath } = require('./imageCache');

const app = express();

// Lista fija, sin persistencia: 1.13 solo pide mostrar algunas tareas
// de ejemplo, no leerlas de ningun lado.
const HARDCODED_TODOS = [
  'Aprender los fundamentos de Kubernetes',
  'Desplegar la aplicacion en el cluster',
  'Configurar volumenes persistentes',
];

app.get('/', async (req, res) => {
  try {
    await ensureImage();
  } catch (err) {
    console.error('Error obteniendo la imagen:', err);
  }

  const imageTag = imageExists()
    ? '<img src="/image" alt="Imagen aleatoria" />'
    : '<p>No se pudo cargar la imagen todavia.</p>';

  const todosList = HARDCODED_TODOS.map((todo) => `<li>${todo}</li>`).join('\n');

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

        <form id="todo-form">
          <input type="text" id="todo-input" maxlength="140" placeholder="Enter a new todo (max 140 characters)" />
          <button type="button" id="todo-send">Send</button>
        </form>

        <h2>Todos</h2>
        <ul id="todo-list">
          ${todosList}
        </ul>

        <script>
          document.getElementById('todo-send').addEventListener('click', () => {
            const input = document.getElementById('todo-input');
            const text = input.value.trim();
            if (!text) {
              return;
            }

            const li = document.createElement('li');
            li.textContent = text;
            document.getElementById('todo-list').appendChild(li);

            input.value = '';
          });
        </script>
      </body>
    </html>
  `);
});

app.get('/image', (req, res) => {
  if (!imageExists()) {
    res.status(404).send('No image cached yet');
    return;
  }

  res.sendFile(getImagePath());
});

module.exports = app;
