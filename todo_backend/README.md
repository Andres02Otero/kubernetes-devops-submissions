# Todo Backend

> **Desde el ejercicio 4.10** los manifiestos de Kubernetes del proyecto ya no estan en este repo: viven en el repo de configuracion [kubernetes-devops-project-config](https://github.com/Andres02Otero/kubernetes-devops-project-config), que es el que lee ArgoCD. Este repo conserva solo el codigo y los workflows que construyen las imagenes. Las rutas `manifests/` y los comandos de despliegue de abajo describen como era antes (ver los tags `1.x` a `4.9`).

Guarda las tareas del proyecto (ejercicio 2.2).

- `GET /todos`: devuelve la lista de tareas (JSON, array de strings; **desde 4.5**, array de objetos `{ "id", "content", "done" }`).
- `POST /todos`: crea una tarea nueva. Body JSON `{ "content": "..." }`, maximo 140 caracteres.
- `PUT /todos/<id>` (**desde 4.5**): body JSON `{ "done": true }` (o `false`) marca la tarea como hecha (o pendiente). 400 si el id o el body no son validos, 404 si la tarea no existe.

`ClusterIP` unicamente — no tiene Ingress, el navegador nunca le habla directo. Es `todo_app` quien lo consulta internamente por HTTP.

Desde el ejercicio 2.4, vive en el namespace `project` (no `default`) — ver `../namespaces/README.md`.

**Desde el ejercicio 2.8**, las tareas se guardan en Postgres real (`manifests/postgres.yaml`, `StatefulSet` de 1 replica con `Service` headless `postgres-svc`, mismo patron que `ping_pong` en 2.7), no en memoria — sobreviven a que el Pod se reinicie. La conexion (host/puerto/usuario/base) se pasa por env vars definidas en el Deployment, y la contraseña viene de un `Secret` (`manifests/secret.yaml`), no queda hardcodeada en ningun lado.

**Desde el ejercicio 2.10**, cada request queda logueado a stdout: un log de acceso general (metodo + path) y, en `POST /todos`, un log explicito de si la tarea se acepto o se rechazo (y por que — el limite de 140 caracteres ya existia desde 2.2). Esos logs de stdout son justo lo que recolecta el stack de Grafana/Loki, ver `../monitoring/README.md`.

**Desde el ejercicio 4.2 (`2.2.0`)** hay dos endpoints de salud y un boton de falla simulada:

- `GET /healthz` → `livenessProbe`. Responde 500 solo si la app se marco como rota; tras 3 fallos (~15 s) el kubelet reinicia el contenedor y, como el estado vive en memoria, vuelve sana. No consulta la base a proposito: si Postgres se cae, reiniciar el backend no arregla nada.
- `GET /readyz` → `readinessProbe`. 500 si esta rota o si un `SELECT 1` contra Postgres falla: el Pod sale del Service sin reiniciarse.
- `POST /break` → marca la app como rota (lo llama el boton "Break the app" de `todo_app`). Mientras tanto `/todos` responde 500.

La app ya no espera a Postgres con reintentos ni se cae si no lo encuentra: arranca siempre y la tabla se crea con la primera conexion.

**Persistencia de Postgres corregida en 4.2:** hasta entonces el PVC se montaba en `/var/lib/postgresql`, pero la imagen guarda la base en su propio volumen anonimo `/var/lib/postgresql/data`, asi que los datos se perdian al recrear el Pod. Ahora el PVC se monta en `/var/lib/postgresql/data` con `PGDATA=/var/lib/postgresql/data/pgdata` (los discos de GKE traen `lost+found` y `initdb` exige un directorio vacio). Mismo arreglo en `ping_pong`.

**Desde el ejercicio 4.5 (`3.0.0`, cambio incompatible por el nuevo formato de `GET /todos`)** cada tarea tiene una columna `done` (`BOOLEAN`, por defecto `false`). Las bases creadas antes se migran solas con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, y sus tareas quedan pendientes.

**Desde el ejercicio 4.6 (`3.1.0`)**, despues de guardar en Postgres una tarea creada (`POST`) o actualizada (`PUT`), el backend publica `{ "action": "created" | "updated", "todo": {...} }` en NATS, subject `todos.status` (`src/messaging.js`, URL en `NATS_URL`). Lo consume `../todo_broadcaster`. Si NATS no esta disponible, la tarea se guarda igual y el mensaje se pierde.

**Desde el ejercicio 4.9 (`3.2.0`)** el subject de NATS viene de `NATS_SUBJECT` (por defecto `todos.status`; staging usa `staging.todos.status`). Desde 4.8 las imagenes del proyecto las construye GitHub Actions (tag = SHA del commit en staging, nombre del tag en production); los comandos de abajo son para construirla a mano.

## Build the image

```bash
docker build -t andres09otero/todo-backend:3.1.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -e PGHOST=postgres-svc -e PGPORT=5432 -e PGUSER=postgres -e PGPASSWORD=changeme -e PGDATABASE=postgres -p 3000:3000 andres09otero/todo-backend:3.1.0
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/secret.yaml
kubectl apply -f manifests/postgres.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```

`todo-backend` puede arrancar antes que `postgres-ss-0`: queda `0/1` (no listo) hasta que la base responde y pasa a `1/1` solo.

## Backup diario a Google Cloud Storage (ejercicio 3.10)

`manifests/backup-cronjob.yaml` (hasta 4.8 en `manifests-gke/`; desde 4.9 corre en production y no en staging) es un `CronJob` (03:00 UTC) con dos contenedores oficiales: un `initContainer` con `postgres:16-alpine` que corre `pg_dump` (formato custom) contra `postgres-svc` y un contenedor `google/cloud-sdk` que sube el `.dump` a `gs://dwk-gke-510204-todo-backups/<namespace>/`. La llave de la cuenta de servicio viene del Secret `storage-sa-key`, creado a mano con `kubectl` y nunca versionado.

Restaurar un respaldo: `pg_restore --clean --if-exists -d postgres archivo.dump`.
