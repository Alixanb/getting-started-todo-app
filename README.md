# Getting Started Todo App

Application todo full-stack (React + Node.js/Express) avec authentification JWT, base de données SQLite/MySQL, migrations, tests unitaires et d'intégration, pipeline CI/CD GitHub Actions, déploiement **Kubernetes** et **observabilité** (Prometheus / Grafana / Loki).

KANBAN : https://trello.com/invite/b/69c52ebb45f3b11aa104ec81/ATTI737c63c3e399a68e722a938a44ec03829AE8616C/modele-kanban

## Table des matières

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Lancer avec Docker](#lancer-avec-docker)
- [Lancer sans Docker](#lancer-sans-docker)
- [Tests](#tests)
- [Configuration](#configuration)
- [Observabilité](#observabilité)
- [Kubernetes](#kubernetes)
- [Structure du projet](#structure-du-projet)
- [CI/CD](#cicd)
- [Architecture Decision Records](#architecture-decision-records)

---

## Architecture

![image](https://github.com/docker/getting-started-todo-app/assets/313480/c128b8e4-366f-4b6f-ad73-08e6652b7c4d)

Architecture **3-tiers** : trois images Docker indépendantes, construites depuis leur propre
contexte (`./client`, `./backend`, `./auth`), partageant une base MySQL.

| Service | Image | Rôle | Port |
|---|---|---|---|
| **frontend** | `…-frontend` (nginx) | SPA React/Vite compilée, servie en statique | 80 |
| **backend** | `…-backend` (Node) | API todo-items, table `todo_items` | 3000 |
| **auth** | `…-auth` (Node) | API authentification, table `users` | 3001 |

Un reverse proxy (Traefik en compose, ingress-nginx en Kubernetes) place tout sur une seule
origine et route selon la règle la plus spécifique :

```
/api/auth/*  → auth      (3001)
/api/*       → backend   (3000)
/*           → frontend  (80)
```

L'**auth** émet un JWT (cookie httpOnly) ; le **backend** le vérifie localement avec le
`JWT_SECRET` partagé — aucun appel réseau entre services (stateless). En développement, Vite et
nodemon tournent avec hot-reload via `docker compose --watch`.

---

## Prérequis

| Outil | Version minimale |
|---|---|
| Docker Desktop | 4.x |
| Node.js _(hors Docker seulement)_ | 20.x |
| npm _(hors Docker seulement)_ | 10.x |

---

## Lancer avec Docker

```bash
git clone https://github.com/docker/getting-started-todo-app
cd getting-started-todo-app
cp .env.example .env          # ajuster JWT_SECRET en production
docker compose up --watch
```

- App : [http://localhost:8080](http://localhost:8080) _(port configurable via `APP_PORT`)_
- phpMyAdmin : [http://db.localhost:8080](http://db.localhost:8080)

> Le port hôte de l'app est `8080` par défaut pour éviter les conflits si le port 80 est déjà
> pris (autre Traefik, serveur web…). Pour utiliser le port 80 : `APP_PORT=80 docker compose up`.

Les modifications du code backend et frontend sont répercutées automatiquement sans rebuild.

### Arrêter

```bash
docker compose down
```

---

## Lancer sans Docker

### Backend (API items)

```bash
cd backend
npm install
SQLITE_DB_LOCATION=./todo.db npm run dev
```

Le backend écoute sur `http://localhost:3000`.

### Auth (API authentification)

Dans un second terminal :

```bash
cd auth
npm install
SQLITE_DB_LOCATION=./auth.db npm run dev
```

Le service auth écoute sur `http://localhost:3001`.

### Frontend

Dans un troisième terminal :

```bash
cd client
npm install
npm run dev
```

Le frontend Vite écoute sur `http://localhost:5173`.

> Hors Docker, le routage de proxy unique n'existe pas : préférez `docker compose up --watch`
> pour avoir `/api/auth`, `/api` et `/` servis sur la même origine `http://localhost:8080`.

---

## Tests

### Tests unitaires backend (Jest)

```bash
cd backend
npm test
```

Couvre :
- `spec/services/itemService.spec.js` — validation et logique métier (9 tests)
- `spec/routes/*.spec.js` — routes Express mockées (14 tests)

### Tests d'intégration backend (supertest)

```bash
cd backend
npm test -- --testPathPattern=integration
```

10 tests GET/POST/PUT/DELETE sur `/api/items` avec une vraie base SQLite en mémoire.

> Ces tests nécessitent le binding natif `sqlite3`. Ils sont automatiquement skippés si le binding est absent (Node v24 hors Docker) et s'exécutent en CI dans Docker.

### Tests frontend (Vitest)

```bash
cd client
npm test
```

Couvre :
- `src/api/todoApi.test.js` — module fetch API (8 tests)
- `src/hooks/useTodoList.test.js` — hook React (5 tests)
- `src/components/AddNewItemForm.test.jsx` — composant formulaire (5 tests)

### Lint frontend

```bash
cd client
npm run lint
```

> Organisation complète des tests, couverture et seuils : [`docs/testing.md`](docs/testing.md).
> La CI applique un **gate de couverture** (`npm run test:coverage`) côté back et front.

---

## Configuration

Copier `.env.example` en `.env` et ajuster les valeurs :

```bash
cp .env.example .env
```

| Variable | Défaut | Description |
|---|---|---|
| `JWT_SECRET` | `dev-secret-…` | **Obligatoire en prod.** Clé de signature JWT. Générer avec `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | Durée de vie du token JWT (`1h`, `7d`, `30d`…). |
| `SQLITE_DB_LOCATION` | `/etc/todos/todo.db` | Chemin du fichier SQLite. Hors Docker, utiliser un chemin accessible, ex. `./todo.db`. |
| `MYSQL_HOST` | _(non défini)_ | Hôte MySQL. Si défini, l'app bascule sur MySQL au lieu de SQLite. |
| `MYSQL_USER` | — | Utilisateur MySQL. |
| `MYSQL_PASSWORD` | — | Mot de passe MySQL. |
| `MYSQL_DB` | — | Nom de la base MySQL. |
| `MYSQL_HOST_FILE` | — | Chemin vers un fichier contenant l'hôte MySQL (Docker secrets). |
| `MYSQL_USER_FILE` | — | Chemin vers un fichier contenant l'utilisateur MySQL (Docker secrets). |
| `MYSQL_PASSWORD_FILE` | — | Chemin vers un fichier contenant le mot de passe MySQL (Docker secrets). |
| `MYSQL_DB_FILE` | — | Chemin vers un fichier contenant le nom de la base MySQL (Docker secrets). |

---

## Observabilité

L'app expose `/health` (liveness), `/ready` (readiness, ping DB) et `/metrics` (Prometheus), et écrit des
logs JSON structurés. Stack Prometheus + Grafana + Loki/Promtail fournie pour le dev local et pour Kubernetes.

```bash
cp .env.example .env
docker compose -f compose.yaml -f compose.observability.yaml up --build
# App        http://localhost:8080
# Grafana    http://localhost:3001 (admin/admin) — dashboard « Todo App — Overview »
# Prometheus http://localhost:9090
```

Détails et vérification : [`docs/observability.md`](docs/observability.md).

---

## Kubernetes

Déploiement des trois services (frontend, backend, auth) + MySQL, namespace `todo` :

```bash
kubectl apply -k k8s/                 # frontend + backend + auth + MySQL + ingress + HPA
kubectl apply -k k8s/observability/   # Prometheus + Grafana + Loki + Promtail (optionnel)
```

L'ingress route `/api/auth`→auth, `/api`→backend, `/`→frontend sur l'hôte `todo.localhost`.
L'HPA cible le déploiement `backend`.

Prérequis (ingress-nginx, metrics-server), accès et démo autoscaling : [`docs/kubernetes.md`](docs/kubernetes.md).

---

## Structure du projet

```
.
├── backend/                        # Image backend — API todo-items
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.js                  # Express : observabilité + routes /api/items
│   │   ├── middleware/auth.js      # Vérification JWT locale (secret partagé)
│   │   ├── migrations/             # 001 todo_items, 003 add user_id + runner
│   │   ├── persistence/            # Accès données items (SQLite / MySQL)
│   │   ├── routes/                 # getGreeting, get/add/update/deleteItem
│   │   ├── services/itemService.js # Logique métier items
│   │   ├── metrics.js / logger.js  # Prometheus + logs pino
│   └── spec/                       # Tests items + middleware + intégration
├── auth/                           # Image auth — API authentification
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.js                  # Express : observabilité + routes /api/auth
│   │   ├── middleware/auth.js      # Vérification JWT
│   │   ├── migrations/002_users_table.sql + runner
│   │   ├── persistence/            # Accès données users (SQLite / MySQL)
│   │   ├── routes/auth/            # register, login, logout, me, …
│   │   └── services/userService.js # Logique métier auth
│   └── spec/                       # Tests auth + middleware + intégration
├── client/                         # Image frontend — SPA React servie par nginx
│   ├── Dockerfile / nginx.conf
│   └── src/
│       ├── api/                    # Modules fetch (todoApi, authApi)
│       ├── components/ context/ hooks/ pages/
├── k8s/                            # Manifests K8s (frontend, backend, auth, MySQL, ingress, HPA)
│   └── observability/              # Prometheus, Grafana, Loki, Promtail
├── observability/                  # Configs stack observabilité (dev local)
├── docs/                           # Guides (observability, kubernetes, testing) + adr/
├── .github/workflows/ci.yml        # Pipeline CI/CD GitHub Actions
├── compose.yaml                    # Docker Compose (3 services + MySQL + proxy)
├── compose.observability.yaml      # Overlay observabilité
└── .env.example                    # Template de configuration
```

---

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) exécute à chaque push/PR :

1. **test-backend** — `npm run test:coverage` (Jest, items, gate de couverture)
2. **test-auth** — `npm run test:coverage` (Jest, auth, gate de couverture)
3. **test-frontend** — `npm run lint` + `npm run test:coverage` (Vitest + ESLint, gate de couverture)
4. **build-and-push** — matrice qui build et pousse les **3 images** vers `ghcr.io`
   (`…-frontend`, `…-backend`, `…-auth`) _(uniquement sur `main`, si tous les tests passent)_

> **Action manuelle requise pour activer le push Docker :**
> `Settings > Actions > Workflow permissions` → cocher **"Read and write permissions"**

---

## Architecture Decision Records

Les décisions d'architecture sont documentées dans [`docs/adr/`](docs/adr/) :

| ADR | Décision |
|---|---|
| [001](docs/adr/001-service-layer.md) | Couche service backend |
| [002](docs/adr/002-sqlite-mysql-dual.md) | Double persistance SQLite / MySQL |
| [003](docs/adr/003-frontend-api-module.md) | Module API frontend séparé |
| [004](docs/adr/004-jwt-httponly-cookie.md) | JWT dans cookie httpOnly |
| [005](docs/adr/005-kubernetes-orchestration.md) | Orchestration Kubernetes (image bundlée) |
| [006](docs/adr/006-observability-stack.md) | Stack Prometheus / Grafana / Loki |
| [007](docs/adr/007-health-readiness-probes.md) | Probes `/health` & `/ready` |
| [008](docs/adr/008-structured-logging.md) | Logs structurés pino |
