// index.js
//
// Broadcaster del ejercicio 4.6: escucha en NATS los mensajes que publica
// todo_backend al crear o actualizar una tarea (subject NATS_SUBJECT) y los
// reenvia a un servicio externo. Se usa la opcion "Generic" del enunciado:
// un POST a BROADCAST_URL con { "user": "bot", "message": "..." }.
//
// Se puede escalar (el Deployment corre 6 replicas) sin duplicar mensajes
// porque todas se suscriben dentro del mismo queue group: NATS entrega
// cada mensaje a UNA sola replica del grupo, no a todas (modo cola, ver
// la pagina "Messaging systems" del curso).
//
// Desde el ejercicio 4.9: sin BROADCAST_URL el broadcaster solo escribe
// cada mensaje en su log y no lo envia a ningun lado (asi corre en
// staging). NATS_SUBJECT separa los mensajes de cada entorno.

const { connect, JSONCodec } = require('nats');

const NATS_URL = process.env.NATS_URL || 'nats://my-nats.nats.svc.cluster.local:4222';
const BROADCAST_URL = process.env.BROADCAST_URL;
const SUBJECT = process.env.NATS_SUBJECT || 'todos.status';
const QUEUE_GROUP = 'broadcaster';

const codec = JSONCodec();

function buildMessage({ action, todo }) {
    if (action === 'created') {
        return `A todo was created: "${todo.content}"`;
    }

    return `A todo was marked as ${todo.done ? 'done' : 'not done'}: "${todo.content}"`;
}

// Un solo intento a proposito: reintentar despues de un fallo a medias (el
// servicio recibio pero la respuesta se perdio) es justo lo que produce
// duplicados, y el enunciado prefiere perder un mensaje a duplicarlo.
async function forward(payload) {
    try {
        const response = await fetch(BROADCAST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
        });
        console.log(`Forwarded "${payload.message}" -> ${response.status}`);
    } catch (err) {
        console.error(`Could not forward "${payload.message}": ${err.message}`);
    }
}

async function main() {
    if (!BROADCAST_URL) {
        console.log('BROADCAST_URL not set: messages are only logged, not forwarded');
    }

    const connection = await connect({
        servers: NATS_URL,
        waitOnFirstConnect: true,
        maxReconnectAttempts: -1,
    });
    console.log(`Connected to NATS at ${NATS_URL}, listening on ${SUBJECT} (queue ${QUEUE_GROUP})`);

    const subscription = connection.subscribe(SUBJECT, { queue: QUEUE_GROUP });

    for await (const msg of subscription) {
        let event;
        try {
            event = codec.decode(msg.data);
        } catch (err) {
            console.error(`Ignoring malformed message: ${err.message}`);
            continue;
        }

        const payload = { user: 'bot', message: buildMessage(event) };

        if (BROADCAST_URL) {
            await forward(payload);
        } else {
            console.log(`Message (not forwarded): ${JSON.stringify(payload)}`);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
