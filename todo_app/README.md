# Todo App

Servidor base del proyecto (ejercicio 1.2). Al arrancar loguea `Server started in port <PORT>`, leyendo el puerto de la variable de entorno `PORT` (por defecto 3000 si no se define). Todavia no expone el CRUD de tareas, eso llega en un ejercicio posterior.

## Build the image

```bash
docker build -t andres09otero/todo-app:1.0.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 andres09otero/todo-app:1.0.0
```

## View the logs

```bash
docker logs -f <container-id>
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/deployment.yaml
```

## Verify

```bash
kubectl get pods
kubectl logs -f <pod-name>
```
