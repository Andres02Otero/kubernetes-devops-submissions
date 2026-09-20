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
kubectl apply -f manifests/ingress.yaml
```

## Verify

```bash
kubectl get pods
kubectl logs -f <pod-name>
```

## Access from outside the cluster

Since exercise 1.8, access is via Ingress (Service is `ClusterIP`, no longer `NodePort`). Requires a k3d cluster created with port `80` mapped to a host port (see root README). Then open `http://localhost:8081` in a browser.

Port chain: `localhost:8081` → k3d load balancer → Ingress (`todo-app-ingress`, port 80) → Service (`todo-app-svc`, `port: 1234`) → Pod container (`targetPort: 3000`).

Note: `log_output`'s Ingress must not be applied at the same time (both claim path `/`) — delete it first with `kubectl delete -f ../log_output/manifests/ingress.yaml` if it's still active.

### Alternative: port-forward (no Ingress needed)

```bash
kubectl port-forward <pod-name> 3003:3000
```

Then open `http://localhost:3003`.
