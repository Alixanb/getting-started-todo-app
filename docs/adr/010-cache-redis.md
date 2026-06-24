# ADR-010 — Cache-aside Redis par service

**Status :** Accepté  
**Date :** 2026-06-17

---

## Contexte

Les lectures fréquentes (liste d'items d'un utilisateur, profil) tapent la base à chaque requête.
Un cache réduit la latence et la charge MySQL. Question : un cache partagé ou un par service ?

| Option | Avantages | Inconvénients |
|---|---|---|
| **Pas de cache** | Simple | Chaque lecture = requête SQL |
| **Redis partagé** | Une instance | Couplage entre services, collisions de clés |
| **Redis par service** | Isolation, cohérent avec « database-per-service » | Deux instances à exploiter |

## Décision

Un **Redis par service** (`auth-redis`, `task-redis`), en **cache-aside** :
- **Task** met en cache `items:<userId>` (lecture de la liste), invalidé à chaque écriture
  (`add`/`update`/`delete`) et à la purge `user.deleted`.
- **Auth** met en cache `profile:<userId>`, invalidé sur `updateProfile` / `deleteAccount`.

Activation par présence de `REDIS_HOST` (même pattern que `MYSQL_HOST`). Module
[`src/cache.js`](../../backend/src/cache.js). Compteurs Prometheus `cache_hits_total` /
`cache_misses_total`. TTL par défaut 60 s.

## Conséquences

**Positives :**
- Lectures chaudes servies depuis Redis ; charge MySQL réduite ; métriques de hit/miss exposées.
- **Dégradation gracieuse** : sans `REDIS_HOST` → no-op (lecture en base) ; une erreur Redis est
  loggée et traitée comme un miss → une panne cache ne casse jamais une requête.
- Isolation par service, pas de collision de clés.

**Négatives / limites :**
- Invalidation par TTL + suppression de clé : fenêtre de cohérence éventuelle courte (≤ TTL) si
  une écriture échoue à invalider.
- Deux instances Redis à exploiter (éphémères ici : un cache se reconstruit).
