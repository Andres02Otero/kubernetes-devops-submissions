# Log Output App

Since exercise 1.10, this app is split into **two containers sharing one Pod** via an `emptyDir` volume (`/usr/src/app/files`):

- **`writer/`**: generates a random ID on startup, and every 5 seconds appends a line (`timestamp: randomID`) to a shared file. Also still logs it to stdout (`kubectl logs <pod> -c writer`).
- **`reader/`**: HTTP server, `GET /` returns the **last line** written to the shared file, plus a second line with the ping-pong request count. Accessible via Ingress.

(Before 1.10 this was a single container doing both things — replaced, not kept alongside.)

`reader` also includes the ping-pong count in the response:

```
2020-03-30T12:15:17.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43
Ping / Pongs: 3
```

That count's source changed over time: a `PersistentVolume` shared with `ping_pong` (1.11) → **since 2.1**, `reader` fetches it directly over HTTP from `ping-pong-svc` (`http://ping-pong-svc:3001/pings`), pod-to-pod via Kubernetes' internal DNS — no shared volume between the two apps anymore (it was removed, see `../persistent-volumes/README.md`). `ping_pong` must be deployed and reachable for this to work; on error, `reader` falls back to showing `0` instead of failing the whole response.

**Since exercise 2.3**, this app lives in the `exercises` namespace (not `default`) — see `../namespaces/README.md`. Both `log-output-svc` and `ping-pong-svc` are in that same namespace, so the short DNS name `ping-pong-svc` above still resolves without changes; it would need the `<service>.<namespace>` form if they were split across namespaces.

**Since exercise 2.5**, `reader` also reads a `ConfigMap` (`log-output-config`, `manifests/configmap.yaml`) two different ways: `information.txt` mounted as a file at `/usr/src/app/config/information.txt`, and `MESSAGE` passed as a plain env var (`configMapKeyRef`). Full response now:

```
file content: this text is from file
env variable: MESSAGE=hello world
2020-03-30T12:15:17.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43
Ping / Pongs: 3
```

## Build the images

```bash
docker build -t andres09otero/log-output-writer:1.0.0 writer/
docker build -t andres09otero/log-output-reader:1.2.0 reader/
```

## Push

```bash
docker push andres09otero/log-output-writer:1.0.0
docker push andres09otero/log-output-reader:1.2.0
```

## Deploy with Kubernetes

Requires the `exercises` namespace created first — see `../namespaces/README.md`.

```bash
kubectl apply -f manifests/configmap.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests/ingress.yaml
```

## View the logs

```bash
kubectl logs -f <pod-name> -c writer -n exercises
kubectl logs -f <pod-name> -c reader -n exercises
```

`-c <container-name>` is required now that the Pod has more than one container.

## Access from outside the cluster

Requires a k3d cluster created with port `80` mapped to a host port (see root README). Then open `http://localhost:8081` in a browser.

Port chain: `localhost:8081` → k3d load balancer → Ingress (`log-output-ingress`, port 80) → Service (`log-output-svc`, `port: 2345`) → `reader` container (`targetPort: 3000`, the only one listening on a port in this Pod).

Since exercise 1.9, `log-output-ingress` also routes `/pingpong` to the `ping_pong` app (separate deployment, see `../ping_pong/`) — it must be deployed for that path to work. This Ingress and `todo-app-ingress` both claim path `/`, so only one can be applied at a time (see `../todo_app/README.md`).
