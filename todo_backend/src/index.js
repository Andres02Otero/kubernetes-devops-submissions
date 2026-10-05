// index.js
//
// Punto de entrada: arranca el servidor leyendo el puerto de PORT. Desde
// el ejercicio 4.2 ya no espera a Postgres antes de escuchar; de eso se
// encarga la readinessProbe (ver app.js y manifests/deployment.yaml).

const app = require('./app');
const { connectToNats } = require('./messaging');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

// Sin await a proposito: el servidor no espera a NATS (ver messaging.js).
connectToNats();
