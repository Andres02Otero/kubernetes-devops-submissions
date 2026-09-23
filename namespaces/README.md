# Namespaces

Cluster-wide, kept separate from any single app's `manifests/` folder — same reasoning as `persistent-volumes/`: not specific to one application.

## `exercises` (exercise 2.3)

For `log_output` and `ping_pong` — every course exercise app that is not "the project".

```bash
kubectl apply -f exercises-namespace.yaml
```

## `project` (exercise 2.4)

For `todo_app` and `todo_backend`, plus the image `PersistentVolumeClaim` they depend on (`../persistent-volumes/todoapp-image-pvc.yaml` — the `PersistentVolume` itself stays cluster-scoped, PVs don't belong to a namespace).

```bash
kubectl apply -f project-namespace.yaml
```

## Verify

```bash
kubectl get ns
```
