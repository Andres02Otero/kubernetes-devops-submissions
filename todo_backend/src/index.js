// index.js
//
// Punto de entrada: arranca el servidor leyendo el puerto de PORT.

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
