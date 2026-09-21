# Log Output App

Since exercise 1.10, this app is split into **two containers sharing one Pod** via an `emptyDir` volume (`/usr/src/app/files`):

- **`writer/`**: generates a random ID on startup, and every 5 seconds appends a line (`timestamp: randomID`) to a shared file. Also still logs it to stdout (`kubectl logs <pod> -c writer`).
- **`reader/`**: HTTP server, `GET /` returns the **last line** written to the shared file, plus a second line with the ping-pong request count. Accessible via Ingress.

(Before 1.10 this was a single container doing both things — replaced, not kept alongside.)

Since exercise 1.11, `reader` also mounts the `PersistentVolume` shared with `ping_pong` (see `../persistent-volumes/`) at `/usr/src/app/counter`, and includes its value in the response:

```
2020-03-30T12:15:17.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43
Ping / Pongs: 3
```

## Build the images

```bash
docker build -t andres09otero/log-output-writer:1.0.0 writer/
docker build -t andres09otero/log-output-reader:1.0.0 reader/
```

## Push

```bash
docker push andres09otero/log-output-writer:1.0.0
docker push andres09otero/log-output-reader:1.0.0
```

## Deploy with Kubernetes

Requires the shared PersistentVolume/Claim applied first — see `../persistent-volumes/README.md`.

```bash
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests/ingress.yaml
```

## View the logs

```bash
kubectl logs -f <pod-name> -c writer
kubectl logs -f <pod-name> -c reader
```

`-c <container-name>` is required now that the Pod has more than one container.

## Access from outside the cluster

Requires a k3d cluster created with port `80` mapped to a host port (see root README). Then open `http://localhost:8081` in a browser.

Port chain: `localhost:8081` → k3d load balancer → Ingress (`log-output-ingress`, port 80) → Service (`log-output-svc`, `port: 2345`) → `reader` container (`targetPort: 3000`, the only one listening on a port in this Pod).

Since exercise 1.9, `log-output-ingress` also routes `/pingpong` to the `ping_pong` app (separate deployment, see `../ping_pong/`) — it must be deployed for that path to work. This Ingress and `todo-app-ingress` both claim path `/`, so only one can be applied at a time (see `../todo_app/README.md`).
