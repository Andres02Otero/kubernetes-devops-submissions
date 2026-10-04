// app.js
//
// Arma la app de Express. La ruta raiz devuelve HTML (requisito 1.5),
// con la imagen cacheada (1.12) y el formulario + lista de tareas.
//
// Desde el ejercicio 2.2: las tareas ya no son hardcodeadas (1.13) ni se
// agregan solo con JS del lado del cliente. El navegador le habla a
// todo_app (GET / y POST /todos, server-side rendering) y es todo_app
// quien internamente consulta/crea las tareas en todo-backend-svc.
//
// Desde el ejercicio 2.6: la URL de todo-backend ya no esta hardcodeada,
// viene de TODO_BACKEND_URL (definida en manifests/deployment.yaml).
//
// Desde el ejercicio 4.2: boton "Break the app" que le pide a
// todo-backend que se marque como roto (POST /break), aviso en la pagina
// cuando el backend no responde bien, y GET /healthz para la
// readinessProbe de este Deployment (listo solo si todo-backend lo esta).
//
// Desde el ejercicio 4.5: todo-backend devuelve objetos { id, content,
// done }. Cada tarea pendiente tiene un boton "Mark done" que hace un PUT
// /todos/<id> real desde el navegador (un <form> HTML solo sabe GET/POST,
// por eso va con fetch) y todo_app lo reenvia como PUT al backend.

const express = require('express');
const { ensureImage, imageExists, getImagePath } = require('./imageCache');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const BACKEND_BASE_URL = process.env.TODO_BACKEND_URL || 'http://todo-backend-svc:2345';
const TODO_BACKEND_URL = `${BACKEND_BASE_URL}/todos`;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Antes de 4.2 cualquier fallo se tragaba como lista vacia; ahora la
// pagina tiene que mostrar que la app esta rota, asi que se distingue.
async function fetchTodos() {
  try {
    const response = await fetch(TODO_BACKEND_URL);
    if (!response.ok) {
      return { todos: [], failed: true };
    }
    return { todos: await response.json(), failed: false };
  } catch (err) {
    console.error('Error consultando todo-backend-svc:', err);
    return { todos: [], failed: true };
  }
}

// El timeout queda por debajo del timeoutSeconds de la readinessProbe.
async function isBackendReady() {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/readyz`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch (err) {
    console.error(`todo-backend-svc not reachable: ${err.message}`);
    return false;
  }
}

app.get('/healthz', async (req, res) => {
  if (!(await isBackendReady())) {
    return res.status(500).json({ status: 'backend not ready' });
  }

  return res.status(200).json({ status: 'ok' });
});

app.get('/', async (req, res) => {
  try {
    await ensureImage();
  } catch (err) {
    console.error('Error obteniendo la imagen:', err);
  }

  const imageTag = imageExists()
    ? '<img src="/image" alt="Imagen aleatoria" />'
    : '<p>No se pudo cargar la imagen todavia.</p>';

  const { todos, failed } = await fetchTodos();
  const brokenBanner = failed
    ? '<p class="broken">The app is not working: the backend is not answering. If it was broken with the button, Kubernetes restarts it in a few seconds, reload the page.</p>'
    : '';
  const todosList = todos.map((todo) => (todo.done
    ? `<li class="done"><span>${escapeHtml(todo.content)}</span><span class="done-label">Done</span></li>`
    : `<li><span>${escapeHtml(todo.content)}</span><button class="mark-done" data-id="${todo.id}">Mark done</button></li>`
  )).join('\n');

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
          li { background: #f5f5f5; border-left: 4px solid #2e7d32; padding: 0.5rem 1rem; margin: 0.5rem 0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
          li.done { border-left-color: #9e9e9e; color: #757575; }
          li.done span:first-child { text-decoration: line-through; }
          .done-label { color: #2e7d32; font-weight: bold; }
          .mark-done { background: #1565c0; padding: 0.3rem 0.7rem; white-space: nowrap; }
          .broken { background: #ffebee; border-left: 4px solid #c62828; padding: 0.5rem 1rem; text-align: left; }
          .break-form { margin-top: 2rem; }
          .break-form button { background: #c62828; }
        </style>
      </head>
      <body>
        <h1>To do App</h1>
        ${brokenBanner}
        ${imageTag}

        <form action="/todos" method="post">
          <input type="text" name="content" maxlength="140" placeholder="Enter a new todo (max 140 characters)" required />
          <button type="submit">Send</button>
        </form>

        <h2>Todos</h2>
        <ul>
          ${todosList}
        </ul>

        <form class="break-form" action="/break" method="post">
          <button type="submit">Break the app</button>
        </form>

        <script>
          document.querySelectorAll('.mark-done').forEach((button) => {
            button.addEventListener('click', async () => {
              button.disabled = true;
              await fetch('/todos/' + button.dataset.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ done: true }),
              });
              window.location.reload();
            });
          });
        </script>
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

app.put('/todos/:id', async (req, res) => {
  try {
    const response = await fetch(`${TODO_BACKEND_URL}/${encodeURIComponent(req.params.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: req.body && req.body.done }),
    });
    // Se reenvia tal cual el status y la respuesta del backend (400, 404...).
    res.status(response.status).json(await response.json());
  } catch (err) {
    console.error('Error actualizando la tarea en todo-backend-svc:', err);
    res.status(502).json({ error: 'todo-backend not reachable' });
  }
});

app.post('/break', async (req, res) => {
  try {
    await fetch(`${BACKEND_BASE_URL}/break`, { method: 'POST' });
  } catch (err) {
    console.error('Error rompiendo todo-backend-svc:', err);
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
