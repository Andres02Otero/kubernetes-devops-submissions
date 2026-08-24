# Log printer App

This apliation print a random ID and a timestamp every 5 seconds.

## Build the image

```bash
docker build -t andres09otero/log-output:1.0.0 .
```

## Run the container

```bash
docker run -d andres09otero/log-output:1.0.0
```

## View the logs

```bash
docker logs -f <container-id>
```

## Deploy with Kubernetes

```bash
kubectl apply -f manifests/deployment.yaml
```