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

