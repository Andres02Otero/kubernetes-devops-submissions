# Todo Backend

Guarda las tareas del proyecto (ejercicio 2.2).

- `GET /todos`: devuelve la lista de tareas (JSON, array de strings).
- `POST /todos`: crea una tarea nueva. Body JSON `{ "content": "..." }`, maximo 140 caracteres.

`ClusterIP` unicamente — no tiene Ingress, el navegador nunca le habla directo. Es `todo_app` quien lo consulta internamente por HTTP.

Desde el ejercicio 2.4, vive en el namespace `project` (no `default`) — ver `../namespaces/README.md`.

**Desde el ejercicio 2.8**, las tareas se guardan en Postgres real (`manifests/postgres.yaml`, `StatefulSet` de 1 replica con `Service` headless `postgres-svc`, mismo patron que `ping_pong` en 2.7), no en memoria — sobreviven a que el Pod se reinicie. La conexion (host/puerto/usuario/base) se pasa por env vars definidas en el Deployment, y la contraseña viene de un `Secret` (`manifests/secret.yaml`), no queda hardcodeada en ningun lado. Al arrancar, la app espera con reintentos a que Postgres este disponible antes de aceptar requests.

**Desde el ejercicio 2.10**, cada request queda logueado a stdout: un log de acceso general (metodo + path) y, en `POST /todos`, un log explicito de si la tarea se acepto o se rechazo (y por que — el limite de 140 caracteres ya existia desde 2.2). Esos logs de stdout son justo lo que recolecta el stack de Grafana/Loki, ver `../monitoring/README.md`.

## Build the image

```bash
docker build -t andres09otero/todo-backend:2.1.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -e PGHOST=postgres-svc -e PGPORT=5432 -e PGUSER=postgres -e PGPASSWORD=changeme -e PGDATABASE=postgres -p 3000:3000 andres09otero/todo-backend:2.1.0
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/secret.yaml
kubectl apply -f manifests/postgres.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```

Espera a que `postgres-ss-0` este `Running` antes de (o mientras) `todo-backend` arranca — la app reintenta sola, pero conviene confirmar con `kubectl get pods -n project`.
