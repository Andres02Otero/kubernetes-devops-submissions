# DevOps with Kubernetes - Exercises submissions

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

Local cluster is created with host ports mapped for NodePort/Ingress access:

```bash
k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2
```
