// resources.js
//
// Los recursos que hacen falta para servir la copia de un DummySite:
// ConfigMap (el HTML), Deployment (nginx sirviendolo), Service e Ingress.
// Todos llevan un ownerReference al DummySite: al borrarlo, el garbage
// collector de Kubernetes borra todo lo que le pertenece, sin codigo de
// limpieza en el controller.

import { createHash } from 'node:crypto';

const NGINX_IMAGE = 'nginx:1.27-alpine';

function ownerReference(site) {
    return {
        apiVersion: site.apiVersion,
        kind: site.kind,
        name: site.metadata.name,
        uid: site.metadata.uid,
        controller: true,
    };
}

function baseMetadata(site, name) {
    return {
        name,
        namespace: site.metadata.namespace,
        labels: {
            app: name,
            'app.kubernetes.io/managed-by': 'dummysite-controller',
            'dummysite.stable.dwk/name': site.metadata.name,
        },
        ownerReferences: [ownerReference(site)],
    };
}

export function resourceName(site) {
    return `dummysite-${site.metadata.name}`;
}

export function hostFor(site, hostSuffix) {
    return `${site.metadata.name}.${hostSuffix}`;
}

export function buildResources(site, html, hostSuffix) {
    const name = resourceName(site);
    // Cambia cuando cambia el HTML: al ir en la plantilla del Pod obliga a
    // un rollout, porque nginx no recarga solo un ConfigMap montado.
    const htmlChecksum = createHash('sha256').update(html).digest('hex');

    const configMap = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: baseMetadata(site, name),
        data: { 'index.html': html },
    };

    const deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: baseMetadata(site, name),
        spec: {
            replicas: 1,
            selector: { matchLabels: { app: name } },
            template: {
                metadata: {
                    labels: { app: name },
                    annotations: { 'dummysite.stable.dwk/html-sha256': htmlChecksum },
                },
                spec: {
                    containers: [{
                        name: 'nginx',
                        image: NGINX_IMAGE,
                        ports: [{ containerPort: 80 }],
                        resources: {
                            requests: { cpu: '5m', memory: '16Mi' },
                            limits: { cpu: '100m', memory: '64Mi' },
                        },
                        volumeMounts: [{ name: 'html', mountPath: '/usr/share/nginx/html', readOnly: true }],
                    }],
                    volumes: [{ name: 'html', configMap: { name } }],
                },
            },
        },
    };

    const service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: baseMetadata(site, name),
        spec: {
            type: 'ClusterIP',
            selector: { app: name },
            ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
        },
    };

    // Por host y no por path: cada copia ocupa la raiz / de su propio host,
    // asi las rutas absolutas de la pagina no chocan con otras apps.
    const ingress = {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        metadata: baseMetadata(site, name),
        spec: {
            rules: [{
                host: hostFor(site, hostSuffix),
                http: {
                    paths: [{
                        path: '/',
                        pathType: 'Prefix',
                        backend: { service: { name, port: { number: 80 } } },
                    }],
                },
            }],
        },
    };

    return [configMap, deployment, service, ingress];
}
