// app.js
//
// Arma la app de Express. Todavia sin rutas de negocio (el CRUD llega
// en un ejercicio posterior). La ruta raiz ahora devuelve HTML en vez de
// texto plano: es el requisito del ejercicio 1.5, que pide responder
// algo a un GET / y que sea accesible via navegador con port-forward.

const express = require('express');
const { ensureImage, imageExists, getImagePath } = require('./imageCache');

const app = express();

app.get('/', async (req, res) => {
  try {
    await ensureImage();
  } catch (err) {
    console.error('Error obteniendo la imagen:', err);
  }

  const imageTag = imageExists()
    ? '<img src="/image" alt="Imagen aleatoria" style="max-width: 400px;" />'
    : '<p>No se pudo cargar la imagen todavia.</p>';

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>To do App</title>
      </head>
      <body>
        <h1>To do App</h1>
        ${imageTag}
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
