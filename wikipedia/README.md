# Wikipedia con init container y sidecar (ejercicio 5.4)

Un solo Pod (`manifests/deployment.yaml`) con tres contenedores que comparten la carpeta publica de nginx mediante un volumen `emptyDir` (el mismo mecanismo que `log_output` en 1.10):

- **init container** `fetch-kubernetes-page` (`curlimages/curl`): corre una vez, antes que los demas, y guarda https://en.wikipedia.org/wiki/Kubernetes como `index.html`.
- **sidecar** `random-page-sidecar` (`curlimages/curl`): en bucle, espera entre 5 y 15 minutos al azar (`RANDOM % 601 + 300` segundos) y reemplaza `index.html` por una pagina aleatoria de https://en.wikipedia.org/wiki/Special:Random. Descarga a un archivo temporal y lo renombra, asi nginx nunca sirve una pagina a medio escribir. Es un sidecar nativo de Kubernetes: un init container con `restartPolicy: Always`, que arranca despues del init container de arriba y sigue corriendo junto a nginx.
- **contenedor principal** `nginx`: solo sirve lo que haya en `/usr/share/nginx/html`.

No hay imagenes propias: solo `nginx` y `curlimages/curl` oficiales.

## Deploy

```bash
kubectl apply -f manifests/
```

La app queda en `http://wiki.localhost:8081` (Ingress de Traefik en k3d). Para ver cuando cambia la pagina:

```bash
kubectl logs -n exercises deploy/wikipedia -c random-page-sidecar -f
```
