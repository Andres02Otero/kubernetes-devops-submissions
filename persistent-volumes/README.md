# Persistent Volumes

Cluster-wide storage definitions (exercise 1.11), kept out of any single app's `manifests/` folder on purpose: a `PersistentVolume` is infrastructure the cluster admin provisions, not something specific to one application. Two apps use this same claim: `ping_pong` (writes the request counter) and `log_output`'s `reader` container (reads it to show alongside its own status).

`shared-pv` is a `local` PV, tied to a specific node (`k3d-k3s-default-agent-0`) and backed by a path on that node's filesystem. Since both apps mount the same `PersistentVolumeClaim`, their Pods must land on that same node — Kubernetes handles this automatically via the PV's `nodeAffinity` once the PVC is bound to it.

## One-time setup: create the backing path on the node

```bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
```

## Apply

```bash
kubectl apply -f persistentvolume.yaml
kubectl apply -f persistentvolumeclaim.yaml
kubectl get pv,pvc
```

`shared-pvc` should show `STATUS: Bound`.
