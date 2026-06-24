# Déploiement Kubernetes

L'application se déploie sur Kubernetes en **microservices** (namespace `todo`, manifests dans
[`k8s/`](../k8s/)) : trois images applicatives (`frontend` nginx, `backend`/task, `auth`),
**une base MySQL et un cache Redis par service**, un **bus Kafka**, et une **API Gateway Kong**.
L'`Ingress` (`todo.localhost`) forwarde tout vers Kong, qui route en interne `/api/auth`→auth,
`/api`→backend, `/`→frontend.

## Prérequis

| Outil                                                               | Pourquoi                              |
| ------------------------------------------------------------------- | ------------------------------------- |
| Un cluster (Docker Desktop K8s, minikube, kind…)                    | exécuter les pods                     |
| `kubectl`                                                           | appliquer les manifests               |
| [ingress-nginx](https://kubernetes.github.io/ingress-nginx/deploy/) | exposer l'app via l'`Ingress`         |
| [metrics-server](https://github.com/kubernetes-sigs/metrics-server) | alimenter l'`HorizontalPodAutoscaler` |

Activer Kubernetes dans Docker Desktop : _Settings → Kubernetes → Enable Kubernetes_.

Installer ingress-nginx et metrics-server (exemple) :

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

## 1. Images

La CI pousse les trois images vers `ghcr.io/<owner>/getting-started-todo-app-{frontend,backend,auth}:latest`.
Les déploiements [`k8s/frontend-deployment.yaml`](../k8s/frontend-deployment.yaml),
[`backend-deployment.yaml`](../k8s/backend-deployment.yaml) et
[`auth-deployment.yaml`](../k8s/auth-deployment.yaml) référencent l'owner `alixanb` (à adapter,
en minuscules).

> En local sans registre (Docker Desktop partage le démon avec le cluster, `imagePullPolicy: IfNotPresent`) :
>
> ```bash
> docker build -t ghcr.io/owner/getting-started-todo-app-frontend:latest ./client
> docker build -t ghcr.io/owner/getting-started-todo-app-backend:latest ./backend
> docker build -t ghcr.io/owner/getting-started-todo-app-auth:latest ./auth
> ```

## 2. Secrets

`k8s/secret.yaml` contient des valeurs **d'exemple**. En vrai, créez le secret hors Git :

```bash
kubectl create secret generic todo-secret -n todo \
  --from-literal=JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" \
  --from-literal=MYSQL_USER=root \
  --from-literal=MYSQL_PASSWORD='un-mot-de-passe-fort'
```

## 3. Déployer l'application

```bash
kubectl apply -k k8s/
# Kafka met ~15-30 s à être prêt ; les services se (re)connectent automatiquement.
kubectl rollout status deployment/kong -n todo
kubectl rollout status deployment/backend -n todo
kubectl rollout status deployment/auth -n todo
kubectl rollout status deployment/frontend -n todo
kubectl get pods,svc,hpa,ingress -n todo
```

Accès via l'`Ingress` (hôte `todo.localhost`) :

```bash
curl http://todo.localhost/                 # SPA (index.html)
curl http://todo.localhost/api/greeting     # backend  → {"greeting":"Hello world!"}
```

> Si l'hôte ne résout pas, ajoutez `127.0.0.1 todo.localhost` à `/etc/hosts`, ou bien
> port-forwardez **Kong** (le point d'entrée) :
> `kubectl port-forward -n todo svc/kong 8080:8000` puis `curl http://localhost:8080/api/greeting`.

## 4. Déployer l'observabilité (optionnel)

```bash
kubectl apply -k k8s/observability/
kubectl rollout status deployment/grafana -n observability
```

Prometheus découvre automatiquement les pods de l'app (annotations `prometheus.io/scrape`).

## Accès via port-forward

Les services sont en `ClusterIP` : ils ne sont **pas** exposés à l'extérieur du cluster.
Pour les ouvrir depuis ta machine, crée un tunnel `port-forward` (format `port-local:port-du-service`).
Chaque commande **bloque** son terminal : lance-en une par terminal (ou ajoute `&`).

| Service    | Commande                                                         | URL locale                             |
| ---------- | ---------------------------------------------------------------- | -------------------------------------- |
| Kong (app) | `kubectl port-forward -n todo svc/kong 8080:8000`                | http://localhost:8080 (point d'entrée) |
| Backend    | `kubectl port-forward -n todo svc/backend 3000:3000`             | http://localhost:3000/api/greeting     |
| Auth       | `kubectl port-forward -n todo svc/auth 3001:3001`                | http://localhost:3001/health           |
| Grafana    | `kubectl port-forward -n observability svc/grafana 3001:3000`    | http://localhost:3001 (admin/admin)    |
| Prometheus | `kubectl port-forward -n observability svc/prometheus 9091:9090` | http://localhost:9090                  |
| Loki       | `kubectl port-forward -n observability svc/loki 3101:3100`       | http://localhost:3100                  |

> ⚠️ **Conflit avec Docker Compose.** Le stack `compose.observability.yaml` utilise les mêmes ports
> (8080, 3001, 9090, 3100). Si Compose tourne encore, ces ports pointent vers les conteneurs Docker,
> **pas** vers Kubernetes. Pour tester réellement le cluster :
>
> - soit couper Compose : `docker compose -f compose.yaml -f compose.observability.yaml down` ;
> - soit choisir des ports locaux différents, ex. `kubectl port-forward -n observability svc/prometheus 19090:9090`.
>
> Vérifier quel Prometheus on regarde : **Status → Targets**. En Kubernetes, les cibles sont des **pods**
> (IP `10.x.x.x`, namespace `todo`) ; en Compose, c'est `backend:3000`.

## 5. Démo autoscaling (HPA)

```bash
kubectl get hpa -n todo -w
# Générer de la charge (dans un autre terminal) :
kubectl run -n todo load --image=busybox --restart=Never -it --rm -- \
  /bin/sh -c "while true; do wget -q -O- http://backend:3000/health; done"
```

Le nombre de réplicas de `backend` doit monter (jusqu'à 5) quand le CPU dépasse 50 %.

## Contenu de `k8s/`

| Fichier                                                              | Rôle                                    |
| -------------------------------------------------------------------- | --------------------------------------- |
| `namespace.yaml`                                                     | namespace `todo`                        |
| `configmap.yaml` / `secret.yaml`                                     | config non sensible / secrets           |
| `kong-configmap.yaml` / `kong-deployment.yaml` / `kong-service.yaml` | API Gateway (DB-less)                   |
| `auth-mysql-*` / `task-mysql-*` (pvc/deployment/service)             | une base MySQL par service              |
| `auth-redis-*` / `task-redis-*` (deployment/service)                 | un cache Redis par service              |
| `kafka-deployment.yaml` / `kafka-service.yaml`                       | bus d'événements (KRaft, mono-nœud)     |
| `frontend-deployment.yaml` / `frontend-service.yaml`                 | SPA React servie par nginx              |
| `backend-deployment.yaml` / `backend-service.yaml`                   | API items (probes `/health` & `/ready`) |
| `auth-deployment.yaml` / `auth-service.yaml`                         | API auth (probes `/health` & `/ready`)  |
| `ingress.yaml`                                                       | edge nginx → Kong                       |
| `hpa.yaml`                                                           | autoscaling CPU du backend 1→5          |
| `kustomization.yaml`                                                 | agrège le tout (`kubectl apply -k`)     |
| `observability/`                                                     | Prometheus, Loki, Promtail, Grafana     |

## Décision liée

- [ADR-005 — Orchestration Kubernetes](adr/005-kubernetes-orchestration.md)
- [ADR-009 — API Gateway Kong](adr/009-api-gateway-kong.md) ·
  [ADR-010 — Cache Redis](adr/010-cache-redis.md) ·
  [ADR-011 — Bus Kafka](adr/011-message-bus-kafka.md) ·
  [ADR-012 — Database per service](adr/012-database-per-service.md)
