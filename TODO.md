# État du projet Todo App

---

## Backlog original — statut de chaque tâche

| Tâche | Statut | Détail |
|---|---|---|
| Écrire les tests unitaires backend | ✅ Fait | `spec/services/itemService.spec.js` (9 tests) + `spec/routes/*.spec.js` (5 fichiers, 14 tests au total) |
| Écrire les tests d'intégration API | ✅ Fait | `backend/spec/integration/items.spec.js` — supertest, 10 tests GET/POST/PUT/DELETE. Skip automatique si sqlite3 natif absent (Node v24 hors Docker) ; s'exécutent en CI Docker. |
| Ajouter des tests frontend (Vitest) | ✅ Fait | `todoApi.test.js` (8 tests), `useTodoList.test.js` (5 tests), `AddNewItemForm.test.jsx` (5 tests) — 18 tests Vitest au total |
| Créer une couche service backend | ✅ Fait | `src/services/itemService.js` (items) + `src/services/userService.js` (utilisateurs) |
| Ajouter validation des entrées (addItem) | ✅ Fait | `itemService.js` : vide, whitespace only, > 255 chars → 400 |
| Corriger la transaction dans updateItem | ✅ Fait | `updateItem` retourne l'item directement en 1 appel SQL dans SQLite et MySQL (plus de double requête) |
| Ajouter un système de migration DB | ✅ Fait | `backend/src/migrations/runner.js` + 3 fichiers SQL numérotés (`001_initial_schema`, `002_users_table`, `003_add_user_id_to_items`) |
| Découper TodoListCard.jsx | ✅ Fait | État et appels API extraits dans `hooks/useTodoList.js` ; `TodoListCard` ne fait que rendre |
| Découper ItemDisplay.jsx | ⚠️ Partiel | Logique API (`updateItem`, `deleteItem`) extraite vers `todoApi.js`. Pas de décomposition en sous-composants visuels. |
| Rédiger les ADR | ✅ Fait | 4 ADR dans `docs/adr/` : service layer, dual DB, frontend api module, JWT httpOnly cookie |
| Documenter SQLITE_DB_LOCATION dans README | ✅ Fait | Section `Configuration` dans `README.md` avec tableau de toutes les variables d'environnement |
| Mettre en place GitHub Actions (CI) | ✅ Fait | `.github/workflows/ci.yml` — 3 jobs : test backend, test frontend + lint, build & push GHCR |
| Optimiser le Dockerfile multi-stage | ✅ Déjà fait | 6 stages : `base → client-base → client-dev/build → backend-dev → test → final`. Aucune modification nécessaire. |
| Publier l'image Docker sur un registry | ✅ Fait | Push vers GHCR (`ghcr.io`) dans le job `build-and-push` du CI. **Action manuelle requise** : `Settings > Actions > Workflow permissions` → "Read and write permissions" |
| Lancer les tests dans la pipeline CI | ✅ Fait | Jobs `test-backend` (Jest) et `test-frontend` (Vitest + lint) bloquent le build si ils échouent |
| Rédiger le plan de refonte | ✅ Fait | Réalisé via les sessions de travail ; `ANALYSE.md` documente l'architecture initiale |
| Analyse architecture | ✅ Fait | `ANALYSE.md` — responsabilités, dépendances, zones à risque (pré-existait, base du plan de refonte) |
| Configurer le Mono Repo | ⚠️ À préciser | La structure `backend/` + `client/` dans un même dépôt constitue déjà un monorepo. Si la tâche visait un outil dédié (Turborepo, Nx, etc.), c'est à définir. |
| Préparer la soutenance projet initial | ❌ Non fait | Tâche non technique — à réaliser manuellement (slides, démo, etc.) |

---

## Authentification & Sécurité ✅ (session 2)

### Backend — Nouveaux fichiers
- **`src/services/userService.js`** : register, login, getProfile, updateProfile, changePassword, deleteAccount (bcrypt cost=12, JWT)
- **`src/middleware/auth.js`** : vérifie le JWT depuis le cookie httpOnly, attache `req.user`
- **`src/routes/auth/register.js`** : `POST /api/auth/register`
- **`src/routes/auth/login.js`** : `POST /api/auth/login` — pose le cookie JWT httpOnly
- **`src/routes/auth/logout.js`** : `POST /api/auth/logout` — efface le cookie
- **`src/routes/auth/me.js`** : `GET /api/auth/me`
- **`src/routes/auth/updateMe.js`** : `PUT /api/auth/me`
- **`src/routes/auth/changePassword.js`** : `PUT /api/auth/me/password`
- **`src/routes/auth/deleteAccount.js`** : `DELETE /api/auth/me` — supprime user + todos

### Backend — Fichiers modifiés
- **`src/app.js`** : helmet, cookie-parser, rate limiter (10 req/15min sur login+register), toutes les routes `/api/items` protégées par `authMiddleware`
- **`src/services/itemService.js`** : toutes les méthodes reçoivent `userId`, passé à la persistance
- **`src/routes/getItems.js` & `addItem.js`** : passent `req.user.id` au service
- **`src/persistence/sqlite.js` & `mysql.js`** : méthodes users (getUserByEmail, getUserById, createUser, updateUser, updateUserPassword, deleteUser, deleteUserItems) + `getItems(userId)` filtre par `user_id`
- **`spec/routes/addItem.spec.js` & `getItems.spec.js`** : mis à jour pour inclure `req.user`
- **`spec/services/itemService.spec.js`** : mis à jour pour `userId`

### Migrations DB
- **`002_users_table.sql`** : table `users` (id, email, first_name, last_name, password_hash, created_at)
- **`003_add_user_id_to_items.sql`** : colonne `user_id` sur `todo_items`

### Frontend — Nouveaux fichiers
- **`src/api/authApi.js`** : register, login, logout, getMe, updateMe, changePassword, deleteAccount
- **`src/context/AuthContext.jsx`** : restauration de session au démarrage, loginUser/logoutUser/updateUser
- **`src/components/ProtectedRoute.jsx`** : redirect `/login` si non connecté, spinner pendant chargement
- **`src/pages/LoginPage.jsx`** : formulaire email + mot de passe, lien register
- **`src/pages/RegisterPage.jsx`** : formulaire prénom/nom/email/mdp + confirmation
- **`src/pages/ProfilePage.jsx`** : édition nom/prénom/email, changement mdp, suppression compte (modale de confirmation)
- **`src/pages/ChangePasswordPage.jsx`** : formulaire ancien + nouveau + confirmation mdp
- **`src/pages/PrivacyPage.jsx`** : page statique RGPD — données collectées, droits d'accès/suppression

### Frontend — Fichiers modifiés
- **`src/App.jsx`** : React Router + `AuthProvider` + routes publiques (`/login`, `/register`, `/privacy`) et protégées (`/`, `/profile`, `/profile/password`) + navbar avec lien profil
- **`src/api/todoApi.js`** : `credentials: 'include'` sur tous les appels (envoi automatique du cookie JWT)
- **`src/api/todoApi.test.js`** : assertions mises à jour pour inclure `credentials: 'include'`

### Documentation
- **`.env.example`** : `JWT_SECRET` et `JWT_EXPIRES_IN` documentés
- **`README.md`** : variables JWT ajoutées dans le tableau de configuration
- **`docs/adr/004-jwt-httponly-cookie.md`** : décision JWT httpOnly vs localStorage vs sessions

### Nouvelles dépendances
- **Backend** : `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `helmet`, `express-rate-limit`
- **Frontend** : `react-router-dom`

---

## Mesures de sécurité en place

| Mesure | Implémentation |
|---|---|
| Mots de passe | bcrypt, cost factor 12 |
| Token d'auth | JWT dans cookie httpOnly, SameSite=Strict, Secure en prod |
| Expiration | 7 jours (configurable `JWT_EXPIRES_IN`) |
| Rate limiting | 10 req/15 min sur `/api/auth/login` et `/api/auth/register` |
| Headers HTTP | helmet (X-Frame-Options, HSTS, CSP, etc.) |
| Isolation des données | Chaque route items filtre par `user_id` du token |
| Droits RGPD | Suppression compte → efface user + tous ses todos immédiatement |

---

## Reste à faire

| Tâche | Priorité | Notes |
|---|---|---|
| Préparer la soutenance | — | Non technique |
| Découper ItemDisplay.jsx (sous-composants) | Basse | La logique API est déjà extraite ; découpe visuelle optionnelle |
| Configurer le Mono Repo (outil dédié) | À définir | Dépend si Turborepo/Nx est attendu ou si la structure actuelle suffit |

---

## Note CI — action manuelle requise

Pour activer le push d'image Docker dans GitHub Actions :  
`Settings > Actions > Workflow permissions` → cocher **"Read and write permissions"**


A faire ADR + la DOC, que tout puissent etre lancé juste en suivant la doc