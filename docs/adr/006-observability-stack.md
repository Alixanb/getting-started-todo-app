# ADR-006 — Stack d'observabilité Prometheus + Grafana + Loki

**Status :** Accepté  
**Date :** 2026-06-15

---

## Contexte

En production (Kubernetes), il faut pouvoir répondre à « l'app est-elle en bonne santé ? »,
« quelle latence/quel taux d'erreur ? » et « que disent les logs ? ». L'application n'exposait
aucune métrique et écrivait des logs non structurés.

| Option | Métriques | Logs | Remarque |
|---|---|---|---|
| **Prometheus + Grafana + Loki** | Prometheus | Loki/Promtail | Léger, standard k8s, même UI (Grafana) |
| ELK / EFK | — | Elasticsearch | Lourd en ressources |
| SaaS (Datadog…) | oui | oui | Payant, données hors infra |

## Décision

Adopter **Prometheus** (métriques), **Loki + Promtail** (logs) et **Grafana** (visualisation,
datasources + dashboard provisionnés).

- Le backend expose `/metrics` (format Prometheus) via `prom-client` : métriques process par défaut
  + un histogramme `http_request_duration_seconds` (labels `method`, `route`, `status_code`).
- Les logs sont en JSON (voir [ADR-008](008-structured-logging.md)) ; Promtail les collecte et les
  pousse vers Loki.
- Deux cibles de déploiement :
  - **Dev local** : `compose.observability.yaml` + dossier [`observability/`](../../observability/).
  - **Kubernetes** : [`k8s/observability/`](../../k8s/observability/) (namespace `observability`,
    Prometheus avec service-discovery par annotations `prometheus.io/scrape`, Promtail en DaemonSet).

## Conséquences

**Positives :**
- Métriques + logs + dashboards avec une seule UI (Grafana), faible empreinte.
- Découverte automatique : Prometheus scrape tout pod annoté `prometheus.io/scrape: "true"`.
- Stack identique en esprit entre dev (compose) et prod (k8s).

**Négatives / limites :**
- Stockage non durable dans les configs fournies (filesystem/emptyDir) — suffisant pour démo/dev,
  à remplacer par des volumes persistants / object storage en production.
- Loki/Prometheus mono-réplica (pas de HA) dans cette configuration d'exemple.
