# ADR-007 — Endpoints de santé : `/health` (liveness) et `/ready` (readiness)

**Status :** Accepté  
**Date :** 2026-06-15

---

## Contexte

Kubernetes a besoin de deux signaux distincts :

- **Liveness** : le process est-il vivant ? Sinon, le conteneur est redémarré.
- **Readiness** : le pod peut-il recevoir du trafic ? Sinon, il est retiré du Service (mais pas tué).

Avant, l'app n'avait aucun endpoint dédié : le fallback SPA `app.get('*')` renvoyait `index.html`
pour toute route, ce qui rendait impossible un vrai healthcheck (et provoquait une erreur sous
Express 5, voir note ci-dessous).

## Décision

Exposer deux endpoints distincts, **avant** le fallback SPA, dans
[`backend/src/app.js`](../../backend/src/app.js) :

| Endpoint | Rôle | Vérifie | Réponse |
|---|---|---|---|
| `GET /health` | Liveness | Rien (le process répond) | `200 {"status":"ok"}` |
| `GET /ready` | Readiness | Connexion DB via `db.ping()` (`SELECT 1`) | `200 {"status":"ready"}` ou `503` |

Les manifests k8s branchent `livenessProbe → /health` et `readinessProbe → /ready`
([`k8s/app-deployment.yaml`](../../k8s/app-deployment.yaml)).

> **Note** : l'ajout de ces routes a révélé que `app.get('*')` est invalide sous Express 5
> (path-to-regexp v8). Le fallback SPA a été corrigé en `app.get(/.*/, …)`.

## Conséquences

**Positives :**
- Redémarrage automatique d'un pod figé (liveness) sans le couper du trafic pour une simple
  latence DB (readiness distincte).
- Pendant un incident base de données, `/ready` passe en `503` : le pod sort du load-balancer mais
  n'est pas tué inutilement.
- `db.ping()` est ajouté aux deux drivers (SQLite et MySQL) → comportement identique.

**Négatives / limites :**
- `/ready` ouvre une requête DB à chaque sonde (toutes les 5 s) — coût négligeable (`SELECT 1`).
- `/health` ne teste pas les dépendances (volontaire : c'est le rôle de `/ready`).
