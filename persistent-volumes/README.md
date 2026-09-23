# Persistent Volumes

Cluster-wide storage definitions, kept out of any single app's `manifests/` folder on purpose: a `PersistentVolume` is infrastructure the cluster admin provisions, not something specific to one application (started this way in exercise 1.11).

Both PVs here are `local`, tied to the node `k3d-k3s-default-agent-0` and backed by a path on that node's filesystem. Kubernetes automatically schedules any Pod using their PVC onto that same node via the PV's `nodeAffinity`, once the PVC is bound.

## `todo-app-image-pv` / `todo-app-image-pvc` (exercise 1.12)

Used by `todo_app` to cache the random Picsum image so it survives Pod restarts and isn't re-fetched on every request. Since exercise 2.4, `todo-app-image-pvc` lives in the `project` namespace (see `../namespaces/README.md`); `todo-app-image-pv` itself has no namespace — PVs are cluster-scoped.

```bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube-todo-images
kubectl apply -f todoapp-image-pv.yaml
kubectl apply -f todoapp-image-pvc.yaml
```

**Moving the PVC to a new namespace (2.4) requires deleting and recreating the PV, not just the PVC** — a `local` PV keeps a `claimRef` to whichever PVC last bound it, and once `Released` it won't auto-bind to a new PVC even with a matching `storageClassName` (same warning the course material gives about this exact scenario). The image files on disk (`/tmp/kube-todo-images` on the node) aren't affected by this — only the PV/PVC Kubernetes objects are:

```bash
kubectl delete pvc todo-app-image-pvc -n default
kubectl delete pv todo-app-image-pv
kubectl apply -f todoapp-image-pv.yaml
kubectl apply -f todoapp-image-pvc.yaml
```

## Verify

```bash
kubectl get pv,pvc
```

The claim should show `STATUS: Bound`.

## Retired: `shared-pv` / `shared-pvc` (exercise 1.11, removed in 2.1)

Used to share the ping-pong counter between `ping_pong` and `log_output` via a file. Exercise 2.1 explicitly replaces this with direct HTTP communication between the two Pods, so this PV/PVC was deleted (both from this folder and, run this if you still have it deployed, from the cluster):

```bash
kubectl delete pvc shared-pvc
kubectl delete pv shared-pv
```
