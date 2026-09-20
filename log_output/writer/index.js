const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const randomID = crypto.randomUUID();

// Mismo path que monta el contenedor "reader" via el volumen emptyDir
// compartido (definido en manifests/deployment.yaml).
const FILE_PATH = path.join('/usr/src/app/files', 'status.log');

function writeStatus() {
    const time = new Date().toISOString();
    const line = `${time}: ${randomID}`;

    console.log(line);
    fs.appendFileSync(FILE_PATH, line + '\n');
}

setInterval(writeStatus, 5000);
writeStatus();
