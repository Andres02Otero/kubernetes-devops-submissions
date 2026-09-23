# Todo Backend

Guarda las tareas del proyecto (ejercicio 2.2). Estado en memoria (arranca vacio), sin base de datos todavia.

- `GET /todos`: devuelve la lista de tareas (JSON).
- `POST /todos`: crea una tarea nueva. Body JSON `{ "content": "..." }`, maximo 140 caracteres.

`ClusterIP` unicamente — no tiene Ingress, el navegador nunca le habla directo. Es `todo_app` quien lo consulta internamente por HTTP.

## Build the image

```bash
docker build -t andres09otero/todo-backend:1.0.1 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -p 3000:3000 andres09otero/todo-backend:1.0.1
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
```
