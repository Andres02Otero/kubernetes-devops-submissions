// imageCache.js
//
// Cachea una imagen aleatoria de Picsum en el PersistentVolume montado en
// /usr/src/app/image-cache (ejercicio 1.12). Regla del ejercicio: la
// imagen se sirve igual durante 10 minutos; pasado ese tiempo, la
// peticion que la encuentra vencida TODAVIA recibe la vieja, y el
// refresh se dispara en segundo plano para que la SIGUIENTE peticion ya
// tenga una nueva. Por eso ensureImage() nunca bloquea en el caso de
// cache vencido, solo en el caso de que no exista ninguna imagen aun.
//
// Desde el ejercicio 2.6: el path del cache y la URL de Picsum ya no
// estan hardcodeados, vienen de IMAGE_CACHE_DIR y PICSUM_URL (definidas
// en manifests/deployment.yaml). IMAGE_CACHE_DIR debe coincidir con el
// mountPath del volumen en ese mismo archivo.

const fs = require('fs');
const path = require('path');

const CACHE_DIR = process.env.IMAGE_CACHE_DIR || '/usr/src/app/image-cache';
const PICSUM_URL = process.env.PICSUM_URL || 'https://picsum.photos/1200';
const IMAGE_PATH = path.join(CACHE_DIR, 'image.jpg');
const META_PATH = path.join(CACHE_DIR, 'fetched-at.txt');

const TEN_MINUTES_MS = 10 * 60 * 1000;

function readFetchedAt() {
    if (!fs.existsSync(META_PATH)) {
        return null;
    }

    const parsed = Date.parse(fs.readFileSync(META_PATH, 'utf-8').trim());
    return Number.isNaN(parsed) ? null : parsed;
}

function isStale() {
    const fetchedAt = readFetchedAt();
    if (fetchedAt === null || !fs.existsSync(IMAGE_PATH)) {
        return true;
    }

    return Date.now() - fetchedAt >= TEN_MINUTES_MS;
}

async function fetchNewImage() {
    const response = await fetch(PICSUM_URL);
    const buffer = Buffer.from(await response.arrayBuffer());

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(IMAGE_PATH, buffer);
    fs.writeFileSync(META_PATH, new Date().toISOString());
}

async function ensureImage() {
    if (!fs.existsSync(IMAGE_PATH)) {
        // No hay nada que mostrar todavia: sin esta primera imagen no hay
        // pagina que servir, asi que aqui si hay que esperar el fetch.
        await fetchNewImage();
        return;
    }

    if (isStale()) {
        fetchNewImage().catch((err) => console.error('Error refrescando la imagen:', err));
    }
}

function imageExists() {
    return fs.existsSync(IMAGE_PATH);
}

function getImagePath() {
    return IMAGE_PATH;
}

module.exports = { ensureImage, imageExists, getImagePath };
