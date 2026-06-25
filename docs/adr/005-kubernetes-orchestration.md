# ADR-005 — Orchestration avec Kubernetes (image bundlée unique)

**Status :** Accepté — *partie « packaging » remplacée* (voir note)  
**Date :** 2026-06-15

> **Note (2026-06-24) :** la décision d'orchestrer avec **Kubernetes** reste valable. En revanche
> le choix d'une **image bundlée unique** a depuis été **remplacé** par un découpage en **trois
> images** (frontend nginx / backend / auth) derrière une API Gateway — voir
> [ADR-009](009-api-gateway-kong.md), [ADR-012](012-database-per-service.md) et le README.
> Le provisionnement du cluster (Azure AKS) est décrit dans [ADR-013](013-iac-terraform-azure.md).

---

## Contexte

L'application tournait jusqu'ici uniquement avec Docker Compose (dev). Pour un déploiement
« production réaliste » (scalabilité horizontale, auto-réparation, montée en charge), il faut
un orchestrateur. Deux questions :

1. **Orchestrateur** : Docker Compose en prod vs Kubernetes.
2. **Packaging** : une image unique (le backend Express sert le frontend compilé) vs deux images
   séparées (frontend Nginx + backend API), à la manière du projet de référence `mean-docker`.

| Option | Avantages | Inconvénients |
|---|---|---|
| Compose en prod | Simple | Pas d'auto-scaling, pas de self-healing, mono-nœud |
| **Kubernetes** | Scaling (HPA), self-healing, rolling updates, probes | Plus de concepts à maîtriser |
| Image unique | Un seul artefact, moins de réseau interne, déjà le mode `final` du Dockerfile | Front et back scalent ensemble |
| 2 images | Scaling indépendant front/back | Plus de manifests, routage Nginx interne |

## Décision

Déployer sur **Kubernetes** avec une **image bundlée unique** (stage `final` du `Dockerfile` :
Express sert les fichiers statiques React + l'API sur le port 3000).

Manifests dans [`k8s/`](../../k8s/), namespace `todo`, appliqués via `kubectl apply -k k8s/` :
`Namespace`, `ConfigMap`, `Secret`, `Deployment`+`Service` pour l'app et pour MySQL, `PersistentVolumeClaim`
MySQL, `Ingress` (hôte `todo.localhost`) et `HorizontalPodAutoscaler` (CPU 50 %, 1→5 réplicas).

## Conséquences

**Positives :**
- Un seul artefact à construire/pousser (déjà produit par la CI), config k8s plus simple.
- `Deployment` app en 2 réplicas + HPA → résilience et montée en charge automatique.
- Probes `liveness`/`readiness` (voir [ADR-007](007-health-readiness-probes.md)) → self-healing.
- Secrets/Config externalisés (ConfigMap/Secret) → image identique dev/prod.

**Négatives / limites :**
- Le frontend et le backend scalent ensemble (acceptable pour cette app monolithique).
- L'`Ingress` suppose un contrôleur ingress-nginx ; l'HPA suppose `metrics-server` (prérequis
  documentés dans [docs/kubernetes.md](../kubernetes.md)).
- Le `Secret` versionné est un exemple : en production réelle, le créer hors Git (voir le commentaire
  dans `k8s/secret.yaml`).
