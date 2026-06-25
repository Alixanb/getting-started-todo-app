# ADR-013 — Infrastructure as Code (Terraform) sur Azure AKS

**Status :** Accepté  
**Date :** 2026-06-24

---

## Contexte

Les manifests Kubernetes ([`k8s/`](../../k8s/)) décrivent *quoi* déployer, mais supposent un
cluster existant. Pour une démo « cloud réaliste » il faut **provisionner l'infrastructure**
(cluster managé + registre d'images) de façon reproductible, et pouvoir **tout détruire vite**
(coût). Trois questions :

1. **Cloud** : le projet est un module Azure → cible **Azure**.
2. **Provisionnement** : portail web (clics) vs CLI scriptée vs **Infrastructure as Code**.
3. **Périmètre du code** : strict minimum vs toute l'infra nécessaire au déploiement.

| Option | Avantages | Inconvénients |
|---|---|---|
| Portail Azure (clics) | Rapide à découvrir | Non reproductible, pas de versioning, dérive |
| Scripts `az` CLI | Scriptable | Impératif, état non suivi, idempotence à gérer |
| **Terraform (IaC)** | Déclaratif, état suivi, `plan`/`apply`/`destroy`, versionné | Courbe d'apprentissage, gestion du state |

## Décision

Provisionner l'infrastructure avec **Terraform** dans [`azure/`](../../azure/). Le code crée
**toute l'infra nécessaire** au déploiement de l'app :

- `azurerm_resource_group` — groupe de ressources (nommage aléatoire via `random_pet`).
- `azurerm_container_registry` (ACR, Basic) — registre d'images privé.
- `azurerm_kubernetes_cluster` (**AKS**) — cluster managé, node pool configurable
  (`var.node_count`, `var.vm_size`), identité `SystemAssigned`.
- `azurerm_role_assignment` (**AcrPull**) — rattache l'ACR à l'AKS pour le pull d'images.

Le bootstrap *in-cluster* (ingress-nginx, metrics-server) reste **manuel** via `kubectl`
(documenté dans [docs/kubernetes.md](../kubernetes.md)) : pas de provider helm/kubernetes dans
Terraform, pour garder le code d'infra simple et découplé de l'app.

Cycle de vie : `terraform apply` (créer) → `az aks get-credentials` → `kubectl apply -k k8s/`
→ `terraform destroy` (tout supprimer en une commande).

## Conséquences

**Positives :**
- Infra reproductible et versionnée ; revue par `terraform plan` avant tout changement.
- **Tear-down en une commande** (`terraform destroy`) → maîtrise des coûts pour une démo.
- ACR rattachée à l'AKS (AcrPull) → pull d'images privées sans secret de registre.
- Variables (`node_count`, `vm_size`, `kubernetes_version`) → cluster ajustable sans toucher au code.

**Négatives / limites :**
- Le **state** Terraform est local (`terraform.tfstate`) et **non versionné** (voir
  `azure/.gitignore`) — pour un usage multi-personnes il faudrait un backend distant (ex. Azure
  Storage). Acceptable pour une démo solo.
- Les images applicatives sont aujourd'hui sur `ghcr.io` (publiques) ; l'attach AcrPull est
  surtout prêt « au cas où » on pousserait vers l'ACR.
- ingress-nginx / metrics-server à installer manuellement après l'`apply`.
