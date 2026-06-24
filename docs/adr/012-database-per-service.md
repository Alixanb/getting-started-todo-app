# ADR-012 — Une base de données par service

**Status :** Accepté  
**Date :** 2026-06-17

---

## Contexte

Après le split en microservices, auth et task partageaient initialement une seule base MySQL
(auth y possédait `users`, task `todo_items`). Le schéma d'architecture cible demande une
**persistance par service** — chaque service propriétaire exclusif de ses données.

| Option | Avantages | Inconvénients |
|---|---|---|
| **Base partagée** | Simple, jointures/cascade SQL possibles | Couplage fort, schéma commun, pas d'isolation |
| **Base par service** | Isolation, déploiement/scaling indépendants, vrai microservice | Plus d'instances, pas de jointure cross-service |

## Décision

**Database-per-service** : `auth-mysql` (table `users`) et `task-mysql` (table `todo_items`),
chacune avec son volume. Chaque service ne connaît que **son** `MYSQL_HOST` (défini par
déploiement, plus dans la config commune). Les migrations restent propres à chaque service
(auth : `002_users` ; task : `001_initial` + `003_add_user_id`).

La seule dépendance cross-service (purge des items d'un compte supprimé) passe désormais par un
**événement Kafka** (voir [ADR-011](011-message-bus-kafka.md)) et non plus par un `DELETE`
cross-base.

## Conséquences

**Positives :**
- Isolation forte : un service ne peut pas lire/écrire les tables d'un autre.
- Bases déployables/scalables indépendamment ; pannes cloisonnées.
- Cohérent avec l'API Gateway, le cache et le bus par service.

**Négatives / limites :**
- Pas de jointure ni de contrainte de clé étrangère entre `users` et `todo_items` ; l'intégrité
  référentielle devient applicative/event-driven.
- Plus d'instances MySQL à exploiter (2 PVC en k8s).
- La cohérence inter-services devient **à terme** (via événements), plus transactionnelle.
