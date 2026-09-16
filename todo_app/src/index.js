// index.js
//
// Punto de entrada: arranca el servidor leyendo el puerto de la variable
// de entorno PORT (requisito explicito del ejercicio 1.2). Separado de
// app.js para no mezclar "definir la app" con "arrancarla".

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
