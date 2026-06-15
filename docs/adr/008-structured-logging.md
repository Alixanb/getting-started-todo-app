# ADR-008 — Logs structurés JSON avec pino

**Status :** Accepté  
**Date :** 2026-06-15

---

## Contexte

Les logs passaient par `console.log` (texte libre). Pour être exploitables par Loki/Promtail
(filtrage par champ, corrélation), ils doivent être **structurés** (un objet JSON par ligne) et
peu coûteux à produire.

| Option | Format | Perf | Remarque |
|---|---|---|---|
| `console.log` | texte libre | ok | Non parsable proprement |
| **pino** | JSON, une ligne | très rapide | Standard Node.js, intégration Express via `pino-http` |
| winston | configurable | correct | Plus lourd/verbeux |

## Décision

Utiliser **pino** ([`backend/src/logger.js`](../../backend/src/logger.js)) et **pino-http**
(middleware) dans [`app.js`](../../backend/src/app.js).

- Sortie JSON sur stdout (collectée par Promtail → Loki, voir [ADR-006](006-observability-stack.md)).
- Niveau via `LOG_LEVEL` (défaut `info`, `silent` en test pour ne pas polluer la sortie Jest).
- Chaque requête HTTP est loggée avec méthode, URL, statut et durée.

## Conséquences

**Positives :**
- Logs requêtables par champ dans Loki/Grafana (`{container=~".*backend.*"}` puis filtres JSON).
- Très faible surcoût CPU comparé à du logging texte.
- Pas de fichier de log à gérer : stdout, conforme aux 12-factor apps et à Kubernetes.

**Négatives / limites :**
- En lecture humaine directe, le JSON est moins lisible (utiliser `pino-pretty` en local si besoin).
- Le niveau `silent` en test masque les logs : voulu, mais penser à `LOG_LEVEL=debug` pour diagnostiquer.
