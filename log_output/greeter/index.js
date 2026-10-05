const http = require('http');

// Ejercicio 5.3: servicio "greeter". Responde a cualquier GET con un saludo
// que dice su version. La misma imagen corre como v1 y v2 (cambia solo la
// env var VERSION); el reparto 75/25 entre ellas lo hace Istio con el
// HTTPRoute de ../manifests/greeter.yaml, la app no sabe nada de eso.
const VERSION = process.env.VERSION || '1';

const server = http.createServer((req, res) => {
    if (req.method !== 'GET') {
        res.writeHead(405);
        res.end();
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Hello from version ${VERSION}`);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Greeter version ${VERSION} started in port ${PORT}`);
});
