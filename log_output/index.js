
const random = require('crypto');
const http = require('http');

const randomID = random.randomUUID();

//Function to print random ID
function printRandom() {

    const time = new Date().toISOString();
    console.log(`${time}: ${randomID}`);
}

setInterval(printRandom, 5000);

printRandom();

// Nuevo en el ejercicio 1.7: servidor HTTP que expone el mismo dato
// (timestamp + randomID) a un GET, para poder verlo desde el navegador
// via Ingress. Antes esto solo vivia en los logs (kubectl logs).
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const time = new Date().toISOString();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${time}: ${randomID}`);
});

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
