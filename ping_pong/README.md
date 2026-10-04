# Ping Pong App

Responde `pong <N>` a `GET /` (hasta 3.3 era `/pingpong`; desde 3.4 el `HTTPRoute` del cluster reescribe `/pingpong` -> `/`), donde `N` es un contador que aumenta con cada request.

`GET /pings` devuelve solo el numero actual del contador (sin incrementar, sin el prefijo `pong `) — pensado para que otros pods lo consulten por HTTP, no para el navegador.

Historial del contador: vivio en memoria (1.9) → se persistio en un `PersistentVolume` compartido con `log_output` (1.11) → volvio a memoria (2.1) → **desde 2.7, vive en una base de datos Postgres real** (`manifests/postgres.yaml`, un `StatefulSet` de 1 replica con `Service` headless `postgres-svc`), usando el paquete `pg`. El incremento es atomico (una sola sentencia `UPDATE ... RETURNING`).

**Desde el ejercicio 4.1 (`3.1.0`)** la app ya no espera a Postgres con reintentos ni se cae si no lo encuentra: arranca siempre y expone `GET /healthz` (200 si un `SELECT 1` contra la base funciona, 500 si no). El `deployment.yaml` tiene una `readinessProbe` sobre ese endpoint, asi que sin base el Pod queda `0/1 Running` (fuera de los endpoints de `ping-pong-svc`) y pasa solo a `1/1` cuando Postgres aparece. Mientras tanto `/` y `/pings` responden 503.

**Desde el ejercicio 2.3**, esta app vive en el namespace `exercises` (no `default`) — ver `../namespaces/README.md`.

**Persistencia corregida en 4.2:** el PVC de Postgres ahora se monta en `/var/lib/postgresql/data` con `PGDATA=/var/lib/postgresql/data/pgdata`; antes se montaba en `/var/lib/postgresql` y la base quedaba en el volumen anonimo de la imagen, perdiendose al recrear el Pod (detalle en `../todo_backend/README.md`).

## Build the image

```bash
docker build -t andres09otero/ping-pong:3.1.1 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -e PGHOST=postgres-svc -e PGPORT=5432 -e PGUSER=postgres -e PGPASSWORD=changeme -e PGDATABASE=postgres -p 3000:3000 andres09otero/ping-pong:3.1.1
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
kubectl apply -f manifests-gke/healthcheck.yaml
```

`ping-pong` can start before `postgres-ss-0`: it stays `0/1` (not ready) until the database answers, then turns `1/1` on its own.

Este Service es `ClusterIP` (sin acceso directo desde fuera) — el acceso publico se hace a traves del Ingress compartido con `log_output`, ver `../log_output/manifests/ingress.yaml` y su README.

## Deploy en GKE (ejercicios 3.1 a 3.4)

`manifests-gke/` solo contiene lo que cambia respecto a k3d; `secret.yaml` y `deployment.yaml` se reutilizan de `manifests/`. Diferencias:

- `service.yaml` (ya no existe en `manifests-gke/`): en 3.1 era `LoadBalancer` en el puerto 80 (tag `3.1`), en 3.2 `NodePort` en el 3001 porque el Ingress de GKE lo exige (tag `3.2`). **Desde 3.3 con Gateway API vuelve a ser `ClusterIP`**, o sea el mismo `manifests/service.yaml` de k3d.
- `postgres.yaml`: sin `storageClassName`, para que GKE aprovisione el disco con su clase por defecto.

**Cambios de codigo:**
- **3.2 (`2.1.0`):** `GET /` respondia `200 ok` sin tocar el contador, para el health check del Ingress.
- **3.4 (`3.0.0`, cambio incompatible):** la app responde el `pong N` en `/` y ya no tiene ruta `/pingpong`. Ese prefijo solo existe fuera de la app: el `HTTPRoute` (`../log_output/manifests-gke/route.yaml`) lo reescribe a `/` con un filtro `URLRewrite`. Como `/` ahora incrementa el contador, el health check del Gateway se mueve a `/pings` con `manifests-gke/healthcheck.yaml` (un `HealthCheckPolicy` propio de GKE); si siguiera apuntando a `/`, cada chequeo sumaria un ping.

**Ojo con k3d:** el Ingress de `../log_output/manifests/ingress.yaml` manda `/pingpong` tal cual, sin reescribir, asi que desde la imagen `3.0.0` ese path daria 404 en k3d. Solo vale para el despliegue en GKE.

```bash
kubectl apply -f ../namespaces/exercises-namespace.yaml
kubectl apply -f manifests/secret.yaml
kubectl apply -f manifests-gke/postgres.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests-gke/healthcheck.yaml
```

El acceso publico es por el Gateway compartido con `log_output`, ver `../log_output/README.md`.

Borrar el cluster al terminar para no gastar creditos: `gcloud container clusters delete dwk-cluster --zone=europe-north1-b`.
