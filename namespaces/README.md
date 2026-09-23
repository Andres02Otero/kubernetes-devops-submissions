# Namespaces

Cluster-wide, kept separate from any single app's `manifests/` folder — same reasoning as `persistent-volumes/`: not specific to one application.

## `exercises` (exercise 2.3)

For `log_output` and `ping_pong` — every course exercise app that is not "the project". The project (`todo_app`, `todo_backend`) gets its own separate namespace in exercise 2.4, and stays in `default` until then.

```bash
kubectl apply -f exercises-namespace.yaml
kubectl get ns
```
