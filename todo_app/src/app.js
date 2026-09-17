// app.js
//
// Arma la app de Express. Todavia sin rutas de negocio (el CRUD llega
// en un ejercicio posterior). La ruta raiz ahora devuelve HTML en vez de
// texto plano: es el requisito del ejercicio 1.5, que pide responder
// algo a un GET / y que sea accesible via navegador con port-forward.

const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>To do App</title>
      </head>
      <body>
        <h1>To do App</h1>
        <p>El backend esta corriendo. El CRUD de tareas llega en un ejercicio posterior.</p>
      </body>
    </html>
  `);
});

module.exports = app;
