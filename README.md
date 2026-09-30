# DevOps with Kubernetes - Exercises submissions

## Local setup

Cluster created with host ports mapped for NodePort/Ingress access:

```bash
k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2
```

## Deploy del proyecto en GKE con Kustomize (3.5)

`kustomization.yaml` en la raiz lista los recursos del proyecto (`todo_app`, `todo_backend`, `todo_random_article`) y reemplaza los `kubectl apply -f` sueltos por un solo comando. Usa las variantes GKE donde el despliegue en k3d no sirve:

- `todo_backend/manifests-gke/postgres.yaml`: sin `storageClassName: local-path`.
- `persistent-volumes/gke/todoapp-image-pvc.yaml`: PVC sin clase ni PV a mano (GKE crea el disco).
- `todo_app/manifests-gke/gateway.yaml` + `route.yaml`: acceso por Gateway API en el namespace `project` (en k3d es el Ingress de `todo_app/manifests/`).

Las apps de ejercicios (`log_output`, `ping_pong`) no estan incluidas.

```bash
kubectl kustomize .     # ver el YAML resultante sin aplicar nada
kubectl apply -k .      # desplegar todo
kubectl get pods,pvc,gateway -n project
```

Requiere Gateway API habilitada en el cluster (ver `log_output/README.md`). Las imagenes y sus tags siguen definidos en cada `deployment.yaml`.

## Despliegue automatico con GitHub Actions (3.6)

`.github/workflows/main.yaml` corre en cada push a una rama (los tags no lo disparan): construye las imagenes de `todo_app`, `todo_backend` y `todo_random_article`, las sube a Artifact Registry (`europe-north1-docker.pkg.dev/<proyecto>/dwk-images/`, tag `<rama>-<sha>`) y despliega con `kustomize edit set image` + `kustomize build . | kubectl apply -f -`. Autentica con Workload Identity Federation (sin llaves guardadas).

Secrets, en el Environment `GKE_PROJECT` del repo (Settings -> Environments): `GKE_PROJECT` (ID del proyecto de Google Cloud), `SERVICE_ACCOUNT` (`github-actions-sa@<proyecto>.iam.gserviceaccount.com`) y `WORKLOAD_IDENTITY_PROVIDER` (`projects/<numero>/locations/global/workloadIdentityPools/github-pool/providers/github-provider`).

**Un entorno por rama (3.7):** `main` se despliega en el namespace `project`; cualquier otra rama, en un namespace con el nombre de la rama. El workflow lo hace con `kustomize edit set namespace`, que reescribe el namespace de todos los recursos (y el objeto `Namespace`, asi que `apply` lo crea). Supone ramas con nombres validos como namespace (minusculas, numeros y guiones). Cada entorno trae su propio Gateway, o sea un balanceador de Google por rama: borrar los entornos que ya no se usen.

**Borrar una rama borra su entorno (3.8):** `.github/workflows/delete-env.yaml` se dispara con el evento `delete`, borra el Gateway y luego el namespace con el nombre de la rama. Ignora tags, `main` y nombres de namespaces protegidos. Como el evento `delete` lee el workflow de la rama por defecto, el archivo tiene que estar en `main`. Mismos secrets del Environment `GKE_PROJECT`.

`todo_app` usa `strategy: Recreate` porque su PVC es `ReadWriteOnce` y un `RollingUpdate` podria dejar el pod nuevo atascado en otro nodo.

## Chapter 2 - Kubernetes Basics
### First Deploy
- [1.1](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.1)
- [1.2](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.2)
- [1.3](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.3)
- [1.4](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.4)

### Introduction to Networking
- [1.5](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.5)
- [1.6](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.6)
- [1.7](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.7)
- [1.8](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.8)
- [1.9](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.9)

### Introduction to Storage
- [1.10](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.10)
- [1.11](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.11)
- [1.12](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.12)
- [1.13](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/1.13)

## Chapter 3 - More building blocks
### Networking between pods
- [2.1](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.1)
- [2.2](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.2)

### Organizing a cluster
- [2.3](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.3)
- [2.4](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.4)

### Configuring applications
- [2.5](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.5)
- [2.6](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.6)

### StatefulSets and Jobs
- [2.7](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.7)
- [2.8](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.8)
- [2.9](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.9)

### Monitoring
- [2.10](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/2.10)

## Chapter 4 - To the cloud
### Introduction to Google Kubernetes Engine
- [3.1](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.1)
- [3.2](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.2)
- [3.3](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.3)
- [3.4](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.4)

### Deployment Pipeline
- [3.5](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.5)
- [3.6](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.6)
- [3.7](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.7)
- [3.8](https://github.com/Andres02Otero/kubernetes-devops-submissions/tree/3.8)

