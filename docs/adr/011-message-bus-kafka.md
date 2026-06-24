# ADR-011 — Bus d'événements Kafka

**Status :** Accepté  
**Date :** 2026-06-17

---

## Contexte

Avec une **base par service** (ADR-012), l'auth ne peut plus supprimer en SQL les `todo_items`
d'un compte supprimé : cette table appartient au service task, dans une autre base. Il faut une
communication inter-services pour la suppression de compte (et, à terme, d'autres événements
métier).

| Option | Avantages | Inconvénients |
|---|---|---|
| **DELETE cross-base** | Direct | Impossible/anti-pattern avec database-per-service |
| **Appel HTTP synchrone auth→task** | Simple | Couplage temporel : si task est down, l'opération échoue |
| **Bus d'événements (Kafka)** | Découplage, asynchrone, rejouable | Une brique d'infra de plus |

## Décision

Adopter **Kafka** (KRaft, mono-nœud) comme bus d'événements. Topic `user-events`.
- **Auth** = producteur : à la suppression d'un compte, publie `{ type: 'user.deleted', userId }`.
- **Task** = consommateur (groupe `task-user-events`) : purge les `todo_items` de l'utilisateur
  dans **sa** base, et invalide le cache.

Activation par présence de `KAFKA_BROKERS` (même pattern que cache/db). Module
[`src/bus.js`](../../backend/src/bus.js), consommateur dans
[`src/consumer.js`](../../backend/src/consumer.js). Le topic est créé idempotemment au démarrage
du consumer (évite la course « topic inexistant » sur un broker neuf).

## Conséquences

**Positives :**
- Découplage : auth n'attend pas task ; la suppression réussit même si task est momentanément
  indisponible (l'event sera consommé plus tard).
- Extensible : d'autres services pourront réagir aux mêmes événements sans modifier l'auth.
- **Dégradation gracieuse** : sans `KAFKA_BROKERS` → producteur no-op, pas de consumer ; la
  publication est best-effort (loggée, jamais propagée à la requête HTTP).

**Négatives / limites :**
- Cohérence **à terme** (eventual consistency) : un court instant peut séparer la suppression du
  compte et la purge des items.
- Kafka met ~15-30 s à être prêt au premier boot ; producteur/consommateur se (re)connectent.
- Mono-nœud, stockage éphémère ici : pas de durabilité/rejouabilité de production.
