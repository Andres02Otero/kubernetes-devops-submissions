// index.js
//
// Controller del ejercicio 5.1. Vigila los DummySite de todos los
// namespaces (watch sobre la API de Kubernetes) y, por cada uno nuevo o
// modificado, descarga su website_url y crea con server-side apply lo
// necesario para servir la copia (ver resources.js). El resultado queda en
// el status del DummySite: kubectl get dummysites muestra Ready o Error.
// Borrar no requiere codigo: los ownerReferences se encargan.

import * as k8s from '@kubernetes/client-node';
import { fetchWebsite } from './website.js';
import { buildResources, hostFor } from './resources.js';

const GROUP = 'stable.dwk';
const VERSION = 'v1';
const PLURAL = 'dummysites';
const FIELD_MANAGER = 'dummysite-controller';
const HOST_SUFFIX = process.env.HOST_SUFFIX || 'localhost';
const RETRY_DELAY_MS = 30000;

const kc = new k8s.KubeConfig();
// Dentro del cluster usa el token de la ServiceAccount; fuera, ~/.kube/config.
kc.loadFromDefault();

const objectApi = k8s.KubernetesObjectApi.makeApiClient(kc);
const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

const retryTimers = new Map();

function key(site) {
    return `${site.metadata.namespace}/${site.metadata.name}`;
}

async function updateStatus(site, status) {
    try {
        await customApi.patchNamespacedCustomObjectStatus(
            {
                group: GROUP,
                version: VERSION,
                namespace: site.metadata.namespace,
                plural: PLURAL,
                name: site.metadata.name,
                body: { status: { ...status, observedGeneration: site.metadata.generation } },
            },
            k8s.setHeaderOptions('Content-Type', k8s.PatchStrategy.MergePatch),
        );
    } catch (err) {
        console.error(`[${key(site)}] could not update status: ${err.message}`);
    }
}

async function reconcile(site) {
    const status = site.status || {};

    // Ya hecho para esta version del spec (tipico al reiniciar el controller,
    // cuando el watch vuelve a entregar todos los DummySite como ADDED).
    if (status.phase === 'Ready' && status.observedGeneration === site.metadata.generation) {
        return;
    }

    const url = site.spec.website_url;
    console.log(`[${key(site)}] copying ${url}`);

    try {
        const html = await fetchWebsite(url);

        // Server-side apply: crea o actualiza cada recurso en una sola
        // llamada, asi reconciliar dos veces el mismo sitio no falla.
        for (const resource of buildResources(site, html, HOST_SUFFIX)) {
            await objectApi.patch(resource, undefined, undefined, FIELD_MANAGER, true, k8s.PatchStrategy.ServerSideApply);
        }

        const copyUrl = `http://${hostFor(site, HOST_SUFFIX)}:8081`;
        console.log(`[${key(site)}] ready at ${copyUrl}`);
        await updateStatus(site, { phase: 'Ready', message: `copy of ${url}`, url: copyUrl });
    } catch (err) {
        console.error(`[${key(site)}] failed: ${err.message}`);
        await updateStatus(site, { phase: 'Error', message: err.message });
        scheduleRetry(site);
    }
}

// Un fallo (sitio caido, red) no genera otro evento en el watch: se reintenta.
function scheduleRetry(site) {
    clearTimeout(retryTimers.get(key(site)));
    retryTimers.set(key(site), setTimeout(() => {
        retryTimers.delete(key(site));
        reconcile(site);
    }, RETRY_DELAY_MS));
}

function startWatch() {
    const watch = new k8s.Watch(kc);

    watch.watch(
        `/apis/${GROUP}/${VERSION}/${PLURAL}`,
        {},
        (type, site) => {
            if (type === 'ADDED' || type === 'MODIFIED') {
                reconcile(site);
            } else if (type === 'DELETED') {
                clearTimeout(retryTimers.get(key(site)));
                retryTimers.delete(key(site));
                console.log(`[${key(site)}] deleted; its resources go with it (ownerReferences)`);
            }
        },
        // La API corta los watch cada cierto tiempo: se vuelve a abrir.
        (err) => {
            if (err) {
                console.error(`watch ended: ${err.message || err}`);
            }
            setTimeout(startWatch, 2000);
        },
    ).catch((err) => {
        console.error(`could not start watch: ${err.message}`);
        setTimeout(startWatch, 5000);
    });
}

console.log(`dummysite-controller started, watching ${PLURAL}.${GROUP}`);
startWatch();
