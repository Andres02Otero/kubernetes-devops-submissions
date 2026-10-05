// website.js
//
// Descarga la pagina de website_url y la deja lista para servirse desde
// otro dominio. No copia imagenes ni CSS: inserta <base href> para que las
// rutas relativas (/estilos.css, imagen.png) se sigan pidiendo al sitio
// original. Con sitios complejos algo puede romperse, y el enunciado lo
// acepta.

// Un ConfigMap admite hasta 1 MiB en total; se deja margen.
const MAX_HTML_BYTES = 900 * 1024;

function escapeAttribute(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function addBaseHref(html, url) {
    const baseTag = `<base href="${escapeAttribute(url)}">`;

    // Si la pagina ya trae su propio <base>, manda el de ella.
    if (/<base\s/i.test(html)) {
        return html;
    }

    if (/<head[^>]*>/i.test(html)) {
        return html.replace(/<head[^>]*>/i, (head) => `${head}${baseTag}`);
    }

    return `${baseTag}${html}`;
}

export async function fetchWebsite(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        // Algunos sitios (Wikipedia, por ejemplo) rechazan clientes sin User-Agent.
        headers: { 'User-Agent': 'dummysite-controller/1.0 (DevOps with Kubernetes course)' },
    });

    if (!response.ok) {
        throw new Error(`GET ${url} answered ${response.status}`);
    }

    // response.url es la direccion final tras las redirecciones: es la
    // correcta para resolver las rutas relativas.
    const html = addBaseHref(await response.text(), response.url);

    if (Buffer.byteLength(html) > MAX_HTML_BYTES) {
        throw new Error(`the page is larger than ${MAX_HTML_BYTES} bytes and does not fit in a ConfigMap`);
    }

    return html;
}
