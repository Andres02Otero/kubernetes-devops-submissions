# Log printer App

This apliation print a random ID and a timestamp every 5 seconds. It also exposes an HTTP endpoint at `/` that responds with the same timestamp + random ID, accessible via Ingress.

## Build the image

```bash
docker build -t andres09otero/log-output:1.1.0 .
```

## Run the container

```bash
docker run -d -p 3000:3000 andres09otero/log-output:1.1.0
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

## Access from outside the cluster

Requires a k3d cluster created with port `80` mapped to a host port (see root README). Then open `http://localhost:8081` in a browser.

Port chain: `localhost:8081` → k3d load balancer → Ingress (`log-output-ingress`, port 80) → Service (`log-output-svc`, `port: 2345`) → Pod container (`targetPort: 3000`).

Since exercise 1.9, `log-output-ingress` also routes `/pingpong` to the `ping_pong` app (separate deployment, see `../ping_pong/`) — it must be deployed for that path to work. This Ingress and `todo-app-ingress` both claim path `/`, so only one can be applied at a time (see `../todo_app/README.md`).