# Todo Broadcaster

> **Desde el ejercicio 4.10** los manifiestos de Kubernetes del proyecto ya no estan en este repo: viven en el repo de configuracion [kubernetes-devops-project-config](https://github.com/Andres02Otero/kubernetes-devops-project-config), que es el que lee ArgoCD. Este repo conserva solo el codigo y los workflows que construyen las imagenes. Las rutas `manifests/` y los comandos de despliegue de abajo describen como era antes (ver los tags `1.x` a `4.9`).

Servicio del ejercicio 4.6. `todo_backend` publica un mensaje en NATS (subject `todos.status`) cada vez que se crea o se actualiza una tarea; el broadcaster se suscribe a ese subject y reenvia cada mensaje a un servicio externo.

Se usa la opcion **"Generic"** del enunciado: un `POST` a la URL de `BROADCAST_URL` con el body

```json
{ "user": "bot", "message": "A todo was created: \"Learn NATS\"" }
```

Mensajes posibles: `A todo was created: "..."`, `A todo was marked as done: "..."` y `A todo was marked as not done: "..."`.

**Escalado sin duplicados:** el Deployment corre **6 replicas** y todas se suscriben dentro del mismo *queue group* (`broadcaster`), asi que NATS entrega cada mensaje a una sola de ellas. Cada mensaje se reenvia con un solo intento: si el servicio externo falla, el mensaje se pierde en vez de arriesgar un duplicado (el enunciado acepta lo primero, no lo segundo).

**Servicio externo de prueba:** `manifests/generic-receiver.yaml` despliega un servidor de eco (`mendhak/http-https-echo`) que responde 200 y escribe en su log cada peticion recibida. Para usar un servicio real basta cambiar `BROADCAST_URL` en `manifests/deployment.yaml`.

**Desde el ejercicio 4.9 (`1.1.0`):** sin `BROADCAST_URL` el broadcaster solo escribe cada mensaje en su log (`Message (not forwarded): ...`) y no lo envia; asi corre en el entorno staging. `NATS_SUBJECT` (por defecto `todos.status`) separa los mensajes de cada entorno: staging usa `staging.todos.status`, para que sus broadcasters no se queden con mensajes de production.

## Requisito: NATS en el cluster

Instalado con Helm, igual que en la pagina del curso (release `my-nats`, namespace `nats`):

```bash
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update
helm upgrade --install my-nats nats/nats --namespace nats --create-namespace
```

## Build the image

```bash
docker build -t andres09otero/todo-broadcaster:1.0.0 .
docker push andres09otero/todo-broadcaster:1.0.0
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/generic-receiver.yaml
kubectl apply -f manifests/deployment.yaml
```

## Verify

```bash
kubectl logs -n project deploy/generic-receiver | grep '"message"'
kubectl logs -n project -l app=broadcaster --prefix | grep Forwarded
```
