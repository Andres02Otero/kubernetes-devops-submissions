// index.js
//
// Punto de entrada: espera a que Postgres este listo (ver db.js) y
// arranca el servidor leyendo el puerto de PORT.

const app = require('./app');
const { waitForDatabase } = require('./db');

const PORT = process.env.PORT || 3000;

waitForDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started in port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
