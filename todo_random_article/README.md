# Todo Random Article

`CronJob` (ejercicio 2.9) que corre cada hora: pide un articulo aleatorio de Wikipedia via el redirect de [`Special:Random`](https://en.wikipedia.org/wiki/Special:Random) (lee el header `Location`, sin bajar el articulo completo) y crea una tarea `Read <URL>` en `todo_backend`.

No es una app Node como el resto del proyecto — es un script de shell (`script.sh`) sobre una imagen `alpine` minima con `curl` + `jq`, ya que es una tarea de un solo paso (pedir un header, hacer un POST), no un servidor.

Detalle importante: Wikipedia devuelve el `Location` del redirect en formato protocol-relative (`//en.wikipedia.org/...`, sin `https:`) — el script lo normaliza a una URL completa, si no el link no serviria pegado directo en un navegador.

## Build the image

```bash
docker build -t andres09otero/todo-random-article:1.0.0 .
```

## Run once locally (prueba manual)

```bash
docker run --rm -e TODO_BACKEND_URL=http://localhost:3000 andres09otero/todo-random-article:1.0.0
```

## Deploy with Kubernetes

Requires `todo_backend` deployed and reachable at `todo-backend-svc:2345` (namespace `project`) — ver `../todo_backend/README.md`.

```bash
kubectl apply -f manifests/cronjob.yaml
```

## Verify

```bash
kubectl get cronjob -n project
```

Para no esperar una hora completa a la primera corrida, se puede disparar un Job manual de una vez a partir del CronJob:

```bash
kubectl create job --from=cronjob/todo-random-article todo-random-article-manual -n project
kubectl get jobs -n project
kubectl logs -n project job/todo-random-article-manual
```
