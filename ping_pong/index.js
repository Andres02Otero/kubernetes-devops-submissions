const http = require('http');

// Desde el ejercicio 2.1: el contador vuelve a vivir solo en memoria
// (antes se persistia en un PersistentVolume compartido con log_output).
// Ahora log_output lo consulta por HTTP en /pings, no leyendo un archivo.
let counter = 0;

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/pingpong') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`pong ${counter}`);
        counter += 1;
        return;
    }

    if (req.method === 'GET' && req.url === '/pings') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(String(counter));
        return;
    }

    res.writeHead(404);
    res.end();
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`);
});
