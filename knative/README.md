# Knative Serving (ejercicio 5.6)

Knative Serving instalado en un cluster k3d nuevo, sin Traefik y con Kubernetes 1.34 (lo que pide el curso para la version actual de Knative):

```bash
k3d cluster create knative --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2 \
  --k3s-arg "--disable=traefik@server:0" --image rancher/k3s:v1.34.1-k3s1
```

Instalacion con YAML segun la [guia oficial](https://knative.dev/docs/install/yaml-install/serving/install-serving-with-yaml/) (Knative v1.23.0), con **Kourier** como capa de red y **Magic DNS (sslip.io)**:

```bash
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-core.yaml
kubectl apply -f https://github.com/knative-extensions/net-kourier/releases/download/knative-v1.23.0/kourier.yaml
kubectl patch configmap/config-network --namespace knative-serving --type merge \
  --patch '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-default-domain.yaml
```

Los pods de `knative-serving` no cayeron en `CrashLoopBackOff` (el problema que advierte el curso): en esta maquina el limite de inotify ya se habia subido para Istio en 5.2 (`fs.inotify.max_user_instances=1024`, `fs.inotify.max_user_watches=524288`), que es la causa tipica de ese error.

## Ejemplos probados

El servicio se llama desde la maquina con el host que da `kubectl get ksvc`:

```bash
curl -H "Host: hello.default.172.31.0.2.sslip.io" http://localhost:8081
```

- **Deploying a Knative Service** (`hello.yaml`): responde `Hello World!`.
- **Autoscaling**: tras unos 60 s sin trafico el pod se termina (escala a cero); la siguiente peticion levanta uno nuevo (arranque en frio de unos 5 s).
- **Traffic splitting** (`hello-traffic-split.yaml`): segunda Revision con `TARGET=Knative` y trafico 50/50 entre `hello-00001` y `hello-00002`. En 40 peticiones: 20 `Hello World!` y 20 `Hello Knative!`.
