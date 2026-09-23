# Todo App

Servidor del proyecto. Al arrancar loguea `Server started in port <PORT>`, leyendo el puerto de la variable de entorno `PORT` (por defecto 3000 si no se define). Responde HTML en `GET /`. Todavia no expone el CRUD de tareas, eso llega en un ejercicio posterior.

Desde el ejercicio 1.12, `GET /` tambien muestra una imagen aleatoria de [Picsum](https://picsum.photos/1200), cacheada en un `PersistentVolume` (`../persistent-volumes/todoapp-image-pv.yaml`) montado en `/usr/src/app/image-cache`. La imagen se reutiliza durante 10 minutos; pasado ese tiempo, esa peticion todavia muestra la vieja y el refresh (llamada a Picsum) se dispara en segundo plano para que la siguiente peticion ya tenga una nueva — asi el request del usuario nunca espera a la API externa salvo la primera vez que no hay ninguna imagen cacheada todavia. `GET /image` sirve el binario de la imagen cacheada.

Desde el ejercicio 1.13, `GET /` tambien incluye un input (max 140 caracteres) + boton "Send" y una lista de tareas.

**Desde el ejercicio 2.2**, la lista ya no es hardcodeada: `todo_app` consulta `GET http://todo-backend-svc:2345/todos` (nuevo microservicio, ver `../todo_backend/`) y renderiza esas tareas server-side. El formulario ahora es un `<form>` real (`action="/todos" method="post"`) — al enviarlo, `todo_app` recibe el POST, se lo reenvia a `todo-backend`, y redirige a `/` para mostrar la lista actualizada (reemplaza el hack de JS del lado del cliente de 1.13, que no persistia nada de verdad).

## Build the image

```bash
docker build -t andres09otero/todo-app:1.4.0 .
```

## Run the container

```bash
docker run -d -e PORT=3000 -p 3000:3000 -v $(pwd)/image-cache-local:/usr/src/app/image-cache andres09otero/todo-app:1.4.0
```

## View the logs

```bash
docker logs -f <container-id>
```

## Deploy with Kubernetes

Requires the `todo-app-image-pv`/`todo-app-image-pvc` applied first — see `../persistent-volumes/README.md`. Also requires `todo_backend` deployed and reachable at `todo-backend-svc:2345` — see `../todo_backend/README.md`.

```bash
kubectl apply -f manifests/deployment.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests/ingress.yaml
```

## Verify

```bash
kubectl get pods
kubectl logs -f <pod-name>
```

## Access from outside the cluster

Since exercise 1.8, access is via Ingress (Service is `ClusterIP`, no longer `NodePort`). Requires a k3d cluster created with port `80` mapped to a host port (see root README). Then open `http://localhost:8081` in a browser.

Port chain: `localhost:8081` → k3d load balancer → Ingress (`todo-app-ingress`, port 80) → Service (`todo-app-svc`, `port: 1234`) → Pod container (`targetPort: 3000`).

Note: `log_output`'s Ingress must not be applied at the same time (both claim path `/`) — delete it first with `kubectl delete -f ../log_output/manifests/ingress.yaml` if it's still active.

### Alternative: port-forward (no Ingress needed)

```bash
kubectl port-forward <pod-name> 3003:3000
```

Then open `http://localhost:3003`.
