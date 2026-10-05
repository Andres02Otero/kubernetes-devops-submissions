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

**Since exercise 4.1 (reader `1.3.0`)**, `reader` exposes `GET /healthz` (200 only if `ping-pong-svc` answers `/pings`, 500 otherwise) and has a `readinessProbe` on it. `writer` has no probe, so while ping-pong is unavailable the Pod shows `1/2` and goes to `2/2` by itself once ping-pong is ready.

## Build the images

```bash
docker build -t andres09otero/log-output-writer:1.0.0 writer/
docker build -t andres09otero/log-output-reader:1.3.0 reader/
```

## Push

```bash
docker push andres09otero/log-output-writer:1.0.0
docker push andres09otero/log-output-reader:1.3.0
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

## Deploy en GKE (ejercicios 3.2 a 3.4)

- **3.2 (tag `3.2`):** Services `NodePort` + el `Ingress` de `manifests/ingress.yaml`.
- **3.3:** el Ingress se reemplaza por **Gateway API**. Los Services vuelven a `ClusterIP` (los mismos `manifests/service.yaml`, por eso ya no hay `service.yaml` en `manifests-gke/`). `manifests-gke/gateway.yaml` define el balanceador (clase `gke-l7-global-external-managed`, HTTP en el 80) y `manifests-gke/route.yaml` el enrutamiento: `/pingpong` -> `ping-pong-svc:3001`, `/` -> `log-output-svc:2345`. Ambos recursos estan en el namespace `exercises`, junto a los Services, y sirven a las dos apps.

- **3.4:** `route.yaml` reescribe `/pingpong` -> `/` con un filtro `URLRewrite` (`ReplacePrefixMatch`), de modo que `ping_pong` responde en `/` y no conoce la URL publica.

Requiere habilitar Gateway API en el cluster una vez (`gcloud container clusters update dwk-cluster --location=europe-north1-b --gateway-api=standard`).

```bash
kubectl apply -f manifests/configmap.yaml
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests-gke/gateway.yaml
kubectl apply -f manifests-gke/route.yaml
```

## GitOps con ArgoCD (ejercicio 4.7)

Desde 4.7 Log output ya no se despliega con `kubectl apply` a mano: **ArgoCD**, que corre dentro del cluster, revisa este repo cada ~3 minutos y deja el namespace `exercises` igual a lo que diga `kustomization.yaml` en `main` (despliegue *pull*: nadie de afuera necesita acceso al cluster).

- `kustomization.yaml`: ConfigMap, Deployment y Service (sin el Ingress de k3d, que choca en `/` con el de `todo_app`), y los tags de imagen.
- `argocd-application.yaml`: el `Application` de ArgoCD (carpeta `log_output`, rama `main`, sync automatico con `prune` y `selfHeal`). Se aplica una vez: `kubectl apply -n argocd -f argocd-application.yaml`.
- `../.github/workflows/log-output-gitops.yaml`: cuando cambia el codigo de `reader/` o `writer/` (o al lanzarlo a mano), construye las dos imagenes con el SHA del commit como tag, las sube a Docker Hub y hace commit del `kustomization.yaml` con el tag nuevo. No toca el cluster; ArgoCD ve ese commit y despliega. Necesita los secrets `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` en el repo.
