# Todo App

Servidor del proyecto. Al arrancar loguea `Server started in port <PORT>`, leyendo el puerto de la variable de entorno `PORT` (por defecto 3000 si no se define). Responde HTML basico a `GET /`. Todavia no expone el CRUD de tareas, eso llega en un ejercicio posterior.

## Build the image

```bash
docker build -t andres09otero/todo-app:1.1.2 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -p 3000:3000 andres09otero/todo-app:1.1.2
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

## Verify

```bash
kubectl get pods
kubectl logs -f <pod-name>
```

## Access from outside the cluster

Requires a k3d cluster created with `30080` mapped to a host port (see root README). Then:

```bash
kubectl get svc todo-app-svc
```

Open `http://localhost:8082` in a browser.

### Alternative: port-forward (no NodePort mapping needed)

```bash
kubectl port-forward <pod-name> 3003:3000
```

Then open `http://localhost:3003`.
