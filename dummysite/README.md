# DummySite (ejercicio 5.1)

Un recurso propio de Kubernetes, `DummySite`, y su controller. Al crear un `DummySite` con un `website_url`, el controller descarga esa pagina y crea lo necesario para servir una copia dentro del cluster.

```yaml
apiVersion: stable.dwk/v1
kind: DummySite
metadata:
  name: example
spec:
  website_url: https://example.com/
```

- `manifests/crd.yaml`: el `CustomResourceDefinition` (`dummysites.stable.dwk`, nombre corto `ds`). `website_url` es obligatorio y debe empezar por `http://` o `https://`. Tiene subrecurso `status`, asi `kubectl get dummysites` muestra la URL, el estado (`Ready` / `Error`) y donde abrir la copia.
- `controller/`: Node.js con la libreria oficial `@kubernetes/client-node`. Vigila (watch) los `DummySite` de todos los namespaces; por cada uno nuevo o modificado descarga la pagina, le agrega `<base href>` (las imagenes y el CSS se siguen pidiendo al sitio original; con sitios complejos algo puede verse roto) y crea con server-side apply un `ConfigMap` con el HTML, un `Deployment` de nginx que lo sirve, un `Service` y un `Ingress` por host (`<nombre>.localhost`). Todos llevan un `ownerReference` al `DummySite`: al borrarlo, Kubernetes borra su copia.
- RBAC: `serviceaccount.yaml`, `clusterrole.yaml` (solo lo que el controller usa) y `clusterrolebinding.yaml`. Es `ClusterRole` porque el controller atiende `DummySite` de cualquier namespace.

## Build the image

```bash
docker build -t andres09otero/dummysite-controller:1.0.1 controller/
docker push andres09otero/dummysite-controller:1.0.1
```

## Deploy (el flujo del enunciado)

```bash
kubectl apply -f manifests/crd.yaml -f manifests/serviceaccount.yaml -f manifests/clusterrole.yaml -f manifests/clusterrolebinding.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/dummysite-example.yaml
kubectl get dummysites
```

La copia queda en `http://example.localhost:8081` (Ingress de Traefik en k3d). `manifests/dummysite-wikipedia.yaml` prueba un sitio mas complejo: `http://wikipedia-kubernetes.localhost:8081`.
