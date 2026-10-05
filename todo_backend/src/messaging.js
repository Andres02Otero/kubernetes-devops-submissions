// messaging.js
//
// Desde el ejercicio 4.6: al crear o actualizar una tarea, el backend
// publica un mensaje en NATS (subject NATS_SUBJECT, por defecto
// todos.status). No sabe nada de quien lo escucha; el broadcaster
// (../todo_broadcaster) se suscribe y lo reenvia al servicio externo. NATS_URL viene de manifests/deployment.yaml.
//
// NATS es opcional para el backend: si no esta disponible las tareas se
// guardan igual y el mensaje simplemente se pierde. El enunciado lo
// permite ("a randomly missing message is not an issue"); lo que no se
// permite son duplicados, y de eso se encarga el broadcaster.

const { connect, JSONCodec } = require('nats');

// Desde el ejercicio 4.9 el subject es configurable: staging y production
// comparten el mismo servidor NATS, y con un subject comun los broadcasters
// de staging (que solo registran en el log) se quedarian con mensajes de
// production, que nunca llegarian al servicio externo.
const SUBJECT = process.env.NATS_SUBJECT || 'todos.status';
const codec = JSONCodec();

let connection = null;

async function connectToNats() {
    if (!process.env.NATS_URL) {
        console.log('NATS_URL not set: todo status messages are disabled');
        return;
    }

    try {
        // waitOnFirstConnect + reconexion infinita: si NATS todavia no
        // existe cuando arranca el backend, el cliente sigue intentando
        // en segundo plano en vez de rendirse.
        connection = await connect({
            servers: process.env.NATS_URL,
            waitOnFirstConnect: true,
            maxReconnectAttempts: -1,
        });
        console.log(`Connected to NATS at ${process.env.NATS_URL}`);
    } catch (err) {
        console.error(`Could not connect to NATS: ${err.message}`);
    }
}

// action: 'created' | 'updated'. Nunca lanza error: un fallo de mensajeria
// no debe tumbar el guardado de la tarea, que ya se hizo en Postgres.
function publishTodoStatus(action, todo) {
    if (!connection || connection.isClosed()) {
        return;
    }

    try {
        connection.publish(SUBJECT, codec.encode({ action, todo }));
    } catch (err) {
        console.error(`Could not publish to NATS: ${err.message}`);
    }
}

module.exports = { connectToNats, publishTodoStatus };
