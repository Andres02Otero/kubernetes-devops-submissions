# Persistent Volumes

Cluster-wide storage definitions, kept out of any single app's `manifests/` folder on purpose: a `PersistentVolume` is infrastructure the cluster admin provisions, not something specific to one application (started this way in exercise 1.11).

Both PVs here are `local`, tied to the node `k3d-k3s-default-agent-0` and backed by a path on that node's filesystem. Kubernetes automatically schedules any Pod using their PVC onto that same node via the PV's `nodeAffinity`, once the PVC is bound.

## `shared-pv` / `shared-pvc` (exercise 1.11)

Used by `ping_pong` (writes the request counter) and `log_output`'s `reader` container (reads it to show alongside its own status).

```bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
kubectl apply -f persistentvolume.yaml
kubectl apply -f persistentvolumeclaim.yaml
```

## `todo-app-image-pv` / `todo-app-image-pvc` (exercise 1.12)

Used by `todo_app` to cache the random Picsum image so it survives Pod restarts and isn't re-fetched on every request.

```bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube-todo-images
kubectl apply -f todoapp-image-pv.yaml
kubectl apply -f todoapp-image-pvc.yaml
```

## Verify

```bash
kubectl get pv,pvc
```

Both claims should show `STATUS: Bound`.
