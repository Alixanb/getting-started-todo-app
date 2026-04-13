# ADR-004 — Authentification par JWT stocké en cookie httpOnly

**Status :** Accepté  
**Date :** 2026-04-15

---

## Contexte

Pour implémenter l'authentification, trois stratégies courantes existent :

| Stratégie | Avantages | Inconvénients |
|---|---|---|
| **Session côté serveur** | Révocation immédiate | Nécessite un stockage serveur (Redis, DB), problème de scalabilité |
| **JWT dans localStorage** | Simple à implémenter | Exposé aux attaques XSS (un script malveillant peut lire et exfiltrer le token) |
| **JWT dans cookie httpOnly** | Non accessible par JavaScript | Nécessite protection CSRF (atténuée par SameSite=Strict) |

## Décision

Utiliser un **JWT stocké dans un cookie httpOnly** avec les attributs suivants :
```
Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict; Secure (en production); Max-Age=604800
```

Le JWT contient : `{ id, email, firstName, lastName }` et expire après 7 jours (configurable via `JWT_EXPIRES_IN`).

La clé de signature est `JWT_SECRET` (variable d'environnement obligatoire en production).

## Conséquences

**Positives :**
- Le cookie `httpOnly` n'est pas accessible par JavaScript → résiste aux attaques XSS.
- `SameSite=Strict` empêche l'envoi du cookie sur des requêtes cross-site → résiste au CSRF sans token dédié.
- Les appels API n'ont pas besoin de gérer manuellement un header `Authorization` : le cookie est envoyé automatiquement par le navigateur (`credentials: 'include'`).
- Architecture stateless : pas de stockage de session côté serveur.

**Négatives / limites :**
- Pas de révocation immédiate : si un token est compromis, il reste valide jusqu'à expiration (7j). En production, réduire la durée ou implémenter une liste noire en DB si nécessaire.
- `Secure` est désactivé en développement (HTTP) pour ne pas bloquer les tests locaux — à activer obligatoirement en production (HTTPS).
- Le `JWT_SECRET` doit être long, aléatoire, et stocké en variable d'environnement — jamais en clair dans le code ou les fichiers versionnés.
