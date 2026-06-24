# Tests & couverture

Le projet a des tests **unitaires** et **d'intégration** côté backend, et des tests **composants/unitaires**
côté frontend. La CI échoue si la **couverture** passe sous les seuils.

## Backend (Jest + supertest)

```bash
cd backend
npm install
npm test               # tous les tests
npm run test:coverage  # tests + couverture (échoue sous les seuils)
```

| Dossier             | Type        | Contenu                                                                     |
| ------------------- | ----------- | --------------------------------------------------------------------------- |
| `spec/services/`    | unitaire    | `itemService`, `userService` (persistance/bcrypt/jwt mockés)                |
| `spec/middleware/`  | unitaire    | `auth.js` (token valide / absent / invalide / expiré)                       |
| `spec/routes/`      | unitaire    | routes items (service mocké)                                                |
| `spec/routes/auth/` | unitaire    | 7 routes auth (service mocké)                                               |
| `spec/integration/` | intégration | `items`, `auth` (parcours complet), `health` — vraie base SQLite en mémoire |

**Seuils** (`backend/jest.config.js`) : statements/lines/functions ≥ 75 %, branches ≥ 65 %.
`src/index.js`, `src/persistence/mysql.js` et les migrations sont exclus du calcul (le driver SQLite est
celui exercé par les tests ; MySQL est validé via compose/k8s).

> **Important** : les tests d'intégration ont besoin du binding natif `sqlite3`. Ils sont automatiquement
> **skippés** hors Docker sur Node récent (le binding ne compile pas), et s'exécutent en CI / dans Docker.
> Pour lancer la suite complète localement :
>
> ```bash
> docker run --rm -v "$PWD/backend":/app -w /app node:22 \
>   sh -c "npm ci && npm run test:coverage"
> ```

## Frontend (Vitest + Testing Library)

```bash
cd client
npm install
npm run lint
npm test               # tous les tests
npm run test:coverage  # tests + couverture
```

| Dossier           | Contenu                                                   |
| ----------------- | --------------------------------------------------------- |
| `src/api/`        | `todoApi`, `authApi` (fetch mocké)                        |
| `src/context/`    | `AuthContext` (restauration session, login/logout/update) |
| `src/components/` | `AddNewItemForm`, `ProtectedRoute`                        |
| `src/pages/`      | `Login`, `Register`, `Profile`, `ChangePassword`          |

**Seuils** (`client/vite.config.js`, `test.coverage.thresholds`) : ≥ 60 % partout.

## CI

`.github/workflows/ci.yml` exécute, à chaque push/PR :

1. **test-backend** — `npm run test:coverage` (Jest, unit + intégration, dans l'env Ubuntu où sqlite3 compile).
2. **test-auth** — `npm run test:coverage` (Jest, service auth).
3. **test-frontend** — `npm run lint` + `npm run test:coverage`.
4. **build-and-push** — matrice qui build et pousse les **3 images** vers GHCR
   (`…-frontend`, `…-backend`, `…-auth`), si les tests passent.

## Tester / pousser les images vers ACR (Azure)

L'app est découpée en **3 images** (un contexte de build par service). Pour ACR :

```bash
az acr login --name todoappanb
for s in frontend:client backend:backend auth:auth; do
  name=${s%%:*}; ctx=${s##*:}
  docker buildx build --platform linux/amd64 \
    -t todoappanb.azurecr.io/getting-started-todo-app-$name:latest ./$ctx --push
done
```

> Les images `backend`/`auth` relancent la suite de tests dans leur stage `test` pendant le build.
