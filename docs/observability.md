# Observabilité

Cette app expose des **métriques**, des **logs structurés** et des **endpoints de santé**, visualisés
avec **Prometheus + Loki + Grafana**.

## Ce que l'application expose

| Endpoint       | Rôle                                  | Exemple de réponse              |
| -------------- | ------------------------------------- | ------------------------------- |
| `GET /health`  | Liveness (le process répond)          | `{"status":"ok"}`               |
| `GET /ready`   | Readiness (base de données joignable) | `{"status":"ready"}` (ou `503`) |
| `GET /metrics` | Métriques Prometheus                  | format texte Prometheus         |

**Métriques clés** (en plus des métriques process Node.js par défaut) :

- `http_request_duration_seconds` — histogramme de la durée des requêtes, labels `method`, `route`, `status_code`.

**Logs** : JSON (un objet par ligne) sur stdout via [pino](adr/008-structured-logging.md). Une ligne par
requête HTTP (méthode, URL, statut, durée).

## Lancer la stack en local (Docker Compose)

La stack d'observabilité est un _overlay_ à combiner avec le compose de base :

```bash
cp .env.example .env
docker compose -f compose.yaml -f compose.observability.yaml up --build
```

Interfaces :

| Service     | URL                   | Identifiants      |
| ----------- | --------------------- | ----------------- |
| Application | http://localhost:8080 | —                 |
| Grafana     | http://localhost:3001 | `admin` / `admin` |
| Prometheus  | http://localhost:9090 | —                 |

> L'app est sur le port **8080** par défaut (configurable via `APP_PORT`) pour éviter les conflits
> de port 80. Grafana, Prometheus et Loki ont leurs propres ports et sont indépendants du proxy.

### Vérifier que tout marche

```bash
# Prometheus voit-il le backend ? (Status > Targets dans l'UI, ou :)
curl -s 'http://localhost:9090/api/v1/query?query=http_request_duration_seconds_count'

# Grafana : datasources Prometheus + Loki provisionnées automatiquement
open http://localhost:3001        # dashboard « Todo App — Overview »
```

Dans Grafana, le dashboard **Todo App — Overview** affiche : débit par route, latence p95, taux d'erreurs
5xx, mémoire du process, et les **logs applicatifs** (via Loki).

## Comment ça s'assemble

```
backend (/metrics) ──scrape──▶ Prometheus ──┐
backend (stdout JSON) ─▶ Promtail ─▶ Loki ──┼──▶ Grafana (dashboards)
```

- **Prometheus** scrape `backend:3000/metrics` (config : `observability/prometheus/prometheus.yml`).
- **Promtail** lit les logs des conteneurs Docker et les pousse vers **Loki**
  (`observability/promtail/`, `observability/loki/`).
- **Grafana** est préconfiguré (datasources + dashboard) via `observability/grafana/provisioning/`.

## En Kubernetes

Voir [kubernetes.md](kubernetes.md). Les manifests sont dans `k8s/observability/` (namespace
`observability`) : Prometheus découvre les pods annotés `prometheus.io/scrape: "true"` (l'app l'est),
Promtail tourne en DaemonSet, Grafana est provisionné de la même façon.

## Décisions liées

- [ADR-006 — Stack d'observabilité](adr/006-observability-stack.md)
- [ADR-007 — Probes santé](adr/007-health-readiness-probes.md)
- [ADR-008 — Logs structurés](adr/008-structured-logging.md)
