# Monitoring (exercise 2.10)

Prometheus (metrics) + Loki (logs) + Alloy (log shipper) + Grafana (UI), installed via Helm into their own `monitoring` namespace. Values files here match the course material closely, adapted to this cluster's naming where needed.

Not app-specific (cluster-wide observability infra), so it's kept out of any app's `manifests/` folder — same reasoning as `persistent-volumes/` and `namespaces/`.

## One-time setup

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

kubectl create namespace monitoring
```

## Install (order matters: storage first, then the collector, then the UI)

```bash
cd "/home/andres-felipe-otero-yarce/UNIVERSIDAD DISTRITAL FRANCISCO JOSÉ DE CALDAS 2/ACTIVIDADES COMPLEMENTARIAS/devops-with-kubernetes/kubernetes-devops-submissions/monitoring"

helm upgrade --install prom prometheus-community/prometheus \
  --namespace monitoring \
  --values prom-values.yaml

helm upgrade --install loki grafana/loki \
  --namespace monitoring \
  --values loki-values.yaml

helm upgrade --install k8smon grafana/k8s-monitoring \
  --namespace monitoring \
  --values k8smon-values.yaml

helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --values grafana-values.yaml
```

## Verify everything is up

```bash
helm list --namespace monitoring
kubectl get pods --namespace monitoring
```

Wait until all four releases (`prom`, `loki`, `k8smon`, `grafana`) show their pods `Running` — can take a few minutes the first time (pulling several images).

## Access Grafana

```bash
kubectl port-forward --namespace monitoring svc/grafana 3000:80
```

Open `http://localhost:3000`, log in with `admin` / `admin`.

## Testing exercise 2.10 (request logging + the 140-char limit)

With `todo_backend` deployed (see `../todo_backend/README.md`):

```bash
# Todo valido
curl -X POST http://localhost:8081/todos -d "content=Tarea normal"

# Todo demasiado largo (deberia rechazarse con 400)
curl -X POST http://localhost:8081/todos -d "content=$(python3 -c "print('x'*150)")"
```

In Grafana, **Explore** → pick the **Loki** datasource → code mode → query:

```
{namespace="project"}
```

You should see both the `Accepted todo: "..."` and `Rejected todo (150 characters, limit is 140): "..."` lines from `todo-backend`.

## Uninstall

```bash
helm delete prom loki k8smon grafana --namespace monitoring
```

Custom Resource Definitions installed by the charts are left behind on purpose (harmless if unused) — remove manually only if truly needed.
