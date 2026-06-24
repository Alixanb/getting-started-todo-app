# ADR-009 — API Gateway Kong (DB-less)

**Status :** Accepté  
**Date :** 2026-06-17

---

## Contexte

Après le découpage en microservices (frontend, backend/task, auth), le client doit atteindre
trois services sur une **origine unique** (sinon le cookie d'auth httpOnly n'est pas envoyé
partout, et CORS se complique). En développement on utilisait un reverse-proxy Traefik ; il
remplit le routage mais reste un simple routeur, sans fonctions « gateway » (rate-limiting, CORS
centralisé, plugins).

| Option | Avantages | Inconvénients |
|---|---|---|
| **Traefik / ingress-nginx seul** | Déjà en place, léger | Pas une vraie API Gateway (plugins limités) |
| **Kong DB-less (déclaratif)** | Vraie gateway, plugins (cors, rate-limiting), config versionnée | Une brique de plus à exploiter |
| **Kong avec base** | Admin API dynamique | Nécessite Postgres, surdimensionné ici |

## Décision

Adopter **Kong en mode DB-less** (config déclarative) comme **API Gateway** et point d'entrée
unique. La config vit dans [`gateway/kong.yml`](../../gateway/kong.yml) (compose) et dans le
ConfigMap `kong-config` (k8s). Routage `strip_path: false`, le plus spécifique d'abord :

```
/api/auth → auth (3001) · /api → backend (3000) · / → frontend
```

Plugins globaux : `cors` (origine centralisée) et `rate-limiting` (1000/min, policy `local`).
En Kubernetes, l'`Ingress` nginx forwarde tout vers Kong qui route en interne.

## Conséquences

**Positives :**
- Point d'entrée unique → cookie d'auth envoyé à tous les services, CORS géré au bord.
- Config déclarative versionnée (pas d'état mutable, reproductible).
- Plugins transverses (rate-limiting, CORS) sans toucher au code applicatif.

**Négatives / limites :**
- Le frontend Vite (dev) refuse un `Host` inconnu → la route frontend utilise
  `preserve_host: true` (inutile pour le nginx de prod).
- Deux configs Kong à garder en phase (compose vs k8s : upstream frontend `client:5173` vs
  `frontend:80`).
- Double saut en k8s (ingress-nginx → Kong) ; acceptable pour représenter clairement la gateway.
