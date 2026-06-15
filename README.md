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

Frontend React (Vite) → API REST Express → SQLite (dev) ou MySQL (prod).

En production, le frontend est compilé en HTML/CSS/JS statiques et servi directement par le backend Express. En développement, Vite et nodemon tournent dans des conteneurs séparés avec hot-reload.

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

### Backend

```bash
cd backend
npm install
SQLITE_DB_LOCATION=./todo.db npm run dev
```

Le backend écoute sur `http://localhost:3000`.

### Frontend

Dans un second terminal :

```bash
cd client
npm install
npm run dev
```

Le frontend Vite écoute sur `http://localhost:5173` et proxie `/api` vers le backend.

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

Déploiement via une image bundlée unique, namespace `todo` :

```bash
kubectl apply -k k8s/                 # app + MySQL + ingress + HPA
kubectl apply -k k8s/observability/   # Prometheus + Grafana + Loki + Promtail (optionnel)
```

Prérequis (ingress-nginx, metrics-server), accès et démo autoscaling : [`docs/kubernetes.md`](docs/kubernetes.md).

---

## Structure du projet

```
.
├── backend/
│   ├── src/
│   │   ├── app.js                  # Point d'entrée Express (middlewares, routes)
│   │   ├── middleware/auth.js      # Vérification JWT depuis cookie httpOnly
│   │   ├── migrations/             # Scripts SQL numérotés + runner
│   │   ├── persistence/            # Couche d'accès données (SQLite / MySQL)
│   │   ├── routes/                 # Routes REST (items + auth)
│   │   └── services/               # Logique métier (itemService, userService)
│   │   ├── metrics.js              # Registre Prometheus + middleware
│   │   └── logger.js               # Logger structuré pino
│   └── spec/
│       ├── routes/ (+ routes/auth) # Tests unitaires des routes
│       ├── middleware/             # Tests unitaires du middleware auth
│       ├── services/               # Tests unitaires des services
│       └── integration/            # Tests d'intégration supertest (items, auth, health)
├── client/
│   └── src/
│       ├── api/                    # Modules fetch (todoApi, authApi)
│       ├── components/             # Composants React
│       ├── context/AuthContext.jsx # Gestion de la session utilisateur
│       ├── hooks/useTodoList.js    # Hook état + appels API todo
│       └── pages/                  # Login, Register, Profile, Privacy
├── k8s/                            # Manifests Kubernetes (app, MySQL, ingress, HPA)
│   └── observability/             # Prometheus, Grafana, Loki, Promtail
├── observability/                  # Configs stack observabilité (dev local)
├── docs/                           # Guides (observability, kubernetes, testing) + adr/
├── .github/workflows/ci.yml        # Pipeline CI/CD GitHub Actions
├── compose.yaml                    # Docker Compose (dev + prod)
├── compose.observability.yaml      # Overlay observabilité
└── .env.example                    # Template de configuration
```

---

## CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) comporte 3 jobs exécutés à chaque push/PR :

1. **test-backend** — `npm run test:coverage` (Jest, unitaires + intégration, gate de couverture)
2. **test-frontend** — `npm run lint` + `npm run test:coverage` (Vitest + ESLint, gate de couverture)
3. **build-and-push** — build Docker multi-stage et push vers `ghcr.io` _(déclenché uniquement si les deux jobs de tests passent)_

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
