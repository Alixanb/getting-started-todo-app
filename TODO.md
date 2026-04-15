# État du projet Todo App

## Authentification & Sécurité ✅ 

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