# Ping Pong App

Responde `pong <N>` a `GET /pingpong`, donde `N` es un contador que aumenta con cada request. No usa dependencias externas (modulo nativo `http`, igual que `log_output`).

Desde el ejercicio 1.11, `N` se persiste en un `PersistentVolume` compartido con `log_output` (ver `../persistent-volumes/`) en vez de vivir solo en memoria — sobrevive a que el Pod se recree. `log_output`'s `reader` lee ese mismo archivo para mostrar el contador junto a su propio status.

## Build the image

```bash
docker build -t andres09otero/ping-pong:1.0.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -p 3000:3000 andres09otero/ping-pong:1.0.0
```

## View the logs

```bash
docker logs -f <container-id>
```

## Deploy with Kubernetes

Requires the shared PersistentVolume/Claim applied first — see `../persistent-volumes/README.md`.

```bash
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```

Este Service es `ClusterIP` (sin acceso directo desde fuera) — el acceso publico se hace a traves del Ingress compartido con `log_output`, ver `../log_output/manifests/ingress.yaml` y su README.
