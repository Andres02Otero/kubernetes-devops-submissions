# Ping Pong App

Responde `pong <N>` a `GET /pingpong`, donde `N` es un contador en memoria que aumenta con cada request. No usa dependencias externas (modulo nativo `http`, igual que `log_output`).

`GET /pings` devuelve solo el numero actual del contador (sin incrementar, sin el prefijo `pong `) — pensado para que otros pods lo consulten por HTTP, no para el navegador.

Historial del contador: vivio en memoria (1.9) → se persistio en un `PersistentVolume` compartido con `log_output` (1.11) → **desde 2.1, vuelve a vivir solo en memoria**, y `log_output` lo consulta por HTTP a traves de `ping-pong-svc` en vez de leer un archivo compartido (el volumen compartido se elimino).

## Build the image

```bash
docker build -t andres09otero/ping-pong:1.1.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -p 3000:3000 andres09otero/ping-pong:1.1.0
```

## View the logs

```bash
docker logs -f <container-id>
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```

Este Service es `ClusterIP` (sin acceso directo desde fuera) — el acceso publico se hace a traves del Ingress compartido con `log_output`, ver `../log_output/manifests/ingress.yaml` y su README.
