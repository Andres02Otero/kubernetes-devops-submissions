# Ping Pong App

Responde `pong <N>` a `GET /pingpong`, donde `N` es un contador que aumenta con cada request.

`GET /pings` devuelve solo el numero actual del contador (sin incrementar, sin el prefijo `pong `) — pensado para que otros pods lo consulten por HTTP, no para el navegador.

Historial del contador: vivio en memoria (1.9) → se persistio en un `PersistentVolume` compartido con `log_output` (1.11) → volvio a memoria (2.1) → **desde 2.7, vive en una base de datos Postgres real** (`manifests/postgres.yaml`, un `StatefulSet` de 1 replica con `Service` headless `postgres-svc`), usando el paquete `pg`. El incremento es atomico (una sola sentencia `UPDATE ... RETURNING`), y al arrancar la app espera con reintentos a que Postgres este disponible antes de aceptar requests (el StatefulSet puede tardar un poco en levantar).

**Desde el ejercicio 2.3**, esta app vive en el namespace `exercises` (no `default`) — ver `../namespaces/README.md`.

## Build the image

```bash
docker build -t andres09otero/ping-pong:2.0.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -e PGHOST=postgres-svc -e PGPORT=5432 -e PGUSER=postgres -e PGPASSWORD=changeme -e PGDATABASE=postgres -p 3000:3000 andres09otero/ping-pong:2.0.0
```

## View the logs

```bash
docker logs -f <container-id>
```

## Deploy with Kubernetes

Requires the `exercises` namespace created first — see `../namespaces/README.md`.

```bash
kubectl apply -f manifests/secret.yaml
kubectl apply -f manifests/postgres.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```

Wait for `postgres-ss-0` to be `Running` before (or while) `ping-pong` starts — the app retries on its own, but `kubectl get pods -n exercises` should eventually show both `Running`.

Este Service es `ClusterIP` (sin acceso directo desde fuera) — el acceso publico se hace a traves del Ingress compartido con `log_output`, ver `../log_output/manifests/ingress.yaml` y su README.
