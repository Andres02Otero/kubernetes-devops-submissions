// app.js
//
// Arma la app de Express. Todavia sin rutas de negocio: el CRUD del
// proyecto llega en un ejercicio posterior (1.4 en adelante). Por ahora
// solo una ruta raiz, util para cuando tengamos acceso al puerto.

const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('todo app is running');
});

module.exports = app;
