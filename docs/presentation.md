# Plan d'oral — 15 min (pitch intrapreneur, audience non technique)

> **Cadre :** vous présentez le projet comme un·e **intrapreneur·e** défendant une initiative
> devant une **équipe non technique** (direction, métier, finance). On explique le **POURQUOI**
> avant le **comment**. Vocabulaire simple, analogies, un visuel par idée.
>
> **Règle d'or :** chaque choix technique = un **bénéfice métier** (argent, temps, risque, clients).
> Pas de jargon non traduit. Si vous dites un mot technique, donnez l'image juste après.
>
> **Durée :** ~15 min → 13 diapos. Timing indicatif à droite de chaque titre.
> Colonne **« Diapo »** = ce qui est affiché. Colonne **« À dire »** = script synthétique (bullets).

---

## Diapo 1 — Accroche / le problème *(~1 min)*

**Diapo :**
- Titre fort : « Et si livrer une nouvelle fonctionnalité ne faisait plus peur ? »
- Une image : une équipe bloquée / une appli qui plante.
- Sous-titre : le projet en une phrase.

**À dire :**
- Aujourd'hui, beaucoup d'applis sont un **bloc unique** : une panne = tout tombe.
- Modifier une partie oblige à **tout retester, tout redéployer** → lent et risqué.
- Notre pari : une appli **modulaire**, **résiliente** et **déployable en un clic**.
- « Je vais vous montrer pourquoi ces choix créent de la valeur, pas juste de la technique. »

---

## Diapo 2 — La vision / l'opportunité *(~1 min)*

**Diapo :**
- 3 mots-clés : **Fiabilité · Vitesse · Maîtrise des coûts**.
- Avant / Après (bloc unique → modules indépendants).

**À dire :**
- L'objectif n'est pas l'appli todo elle-même : c'est une **vitrine d'architecture moderne**.
- Ce qu'on démontre est **réutilisable** pour n'importe quel produit de l'entreprise.
- Promesse : livrer **plus vite**, **tomber moins souvent**, **payer juste ce qu'on consomme**.

---

## Diapo 3 — Le produit en 30 secondes *(~1 min)*

**Diapo :**
- Capture d'écran de l'appli (liste de tâches + connexion).
- 3 usages : je m'inscris, je gère mes tâches, mes données sont privées.

**À dire :**
- Application de gestion de tâches avec **comptes utilisateurs sécurisés**.
- Simple en apparence — mais **dessous**, une architecture de niveau professionnel.
- « Le produit est volontairement simple pour que l'attention porte sur les **fondations**. »

---

## Diapo 4 — L'analogie centrale : la galerie marchande *(~1,5 min)*

**Diapo :**
- Schéma : un **centre commercial** avec des boutiques (services) + un **accueil** (gateway).
- Légende : 1 boutique ferme → les autres restent ouvertes.

**À dire :**
- Plutôt qu'un **seul magasin géant** (tout fragile), on a des **boutiques spécialisées**.
- Une boutique = un service : **connexion**, **tâches**, **interface**.
- Un **accueil unique** oriente chaque visiteur vers la bonne boutique.
- Si une boutique ferme, **le reste du centre fonctionne** → c'est la résilience.

---

## Diapo 5 — L'architecture, vue d'ensemble *(~1,5 min)*

**Diapo :** (reprendre le schéma du README)
```
   Visiteur ─▶ Accueil (API Gateway) ─▶ Connexion ─▶ base Connexion
                                     └▶ Tâches    ─▶ base Tâches
                                     └▶ Interface
                          Connexion ──(événement)──▶ Tâches
```
- 3 services + 1 gateway + bases dédiées + cache + bus d'événements.

**À dire :**
- **Gateway** = l'accueil : un seul point d'entrée, sécurité et règles centralisées.
- Chaque service a **sa propre base** → isolé, pas de contagion d'une panne.
- Les services se parlent par **messages** (comme une boîte aux lettres), sans se bloquer.
- « Retenez l'image : des modules indépendants reliés intelligemment. »

---

## Diapo 6 — Pourquoi une API Gateway *(~1 min)*

**Diapo :**
- Avant : chaque client doit connaître chaque service (spaghetti).
- Après : tout le monde passe par l'accueil.
- Bénéfices : sécurité, limitation d'abus, simplicité.

**À dire :**
- Un **point d'entrée unique** = on sécurise et on contrôle **à un seul endroit**.
- On peut **limiter les abus** (trop de requêtes) et gérer l'accès sans toucher au code des services.
- Pour le métier : **moins de failles**, **moins de maintenance**.

---

## Diapo 7 — Pourquoi une base par service *(~1 min)*

**Diapo :**
- 2 coffres-forts séparés (Connexion / Tâches) vs 1 coffre commun.
- Mot-clé : **isolation**.

**À dire :**
- Chaque service est **propriétaire de ses données** → personne d'autre n'y touche.
- Un incident sur une base **n'affecte pas** l'autre → pannes **cloisonnées**.
- On peut faire évoluer ou **dimensionner** chaque base indépendamment.

---

## Diapo 8 — Cache & bus d'événements : vitesse + découplage *(~1,5 min)*

**Diapo :**
- Cache = « mémoire courte » → réponses instantanées (analogie : on retient au lieu de rechercher).
- Bus d'événements = « boîte aux lettres » entre services.
- Exemple concret : suppression d'un compte → l'événement nettoie les tâches automatiquement.

**À dire :**
- Le **cache** rend l'appli **plus rapide** et soulage les bases → meilleure expérience, moins de coûts.
- Le **bus** permet aux services de **collaborer sans se bloquer** : l'un dépose un message, l'autre le traite quand il peut.
- **Dégradation gracieuse :** si le cache ou le bus tombe, l'appli **continue de fonctionner** (juste un peu moins vite). C'est un filet de sécurité.

---

## Diapo 9 — Le cloud & l'infrastructure « en un clic » *(~1,5 min)*

**Diapo :**
- Logo Azure + mot **Terraform**.
- 3 commandes : `apply` (tout créer) → utiliser → `destroy` (tout supprimer).
- Analogie : un **plan IKEA** de l'infrastructure (un fichier = tout le montage).

**À dire :**
- L'infrastructure est **décrite dans du code** (Infrastructure as Code) → **reproductible**, versionnée, sans clic manuel.
- On **crée tout l'environnement en une commande**, et surtout on **détruit tout en une commande**.
- Bénéfice **financier direct** : on n'allume le cloud que pour la démo → **on ne paie pas à vide**.
- « Pas de configuration “à la main” oubliée : ce qui est écrit = ce qui tourne. »

---

## Diapo 10 — Mise à l'échelle & auto-réparation *(~1 min)*

**Diapo :**
- Schéma : 1 pod → 5 pods quand l'affluence monte (autoscaling).
- Icône « cœur » : redémarrage automatique si un module tombe.

**À dire :**
- Quand l'affluence augmente, le système **se duplique tout seul** pour tenir la charge.
- Si un module plante, il est **redémarré automatiquement** → moins d'interventions humaines.
- Pour le métier : **disponibilité** et **sérénité**, même en pic d'usage.

---

## Diapo 11 — Observabilité : voir avant que ça casse *(~1 min)*

**Diapo :**
- Capture d'un **dashboard** (graphiques de santé, trafic).
- Mots : santé `/health`, métriques, logs.

**À dire :**
- On **mesure tout** : santé des services, trafic, erreurs → **tableaux de bord** en temps réel.
- On détecte les problèmes **avant** les utilisateurs → **confiance** et **réactivité**.
- Analogie : le **tableau de bord d'une voiture** — on ne conduit pas les yeux fermés.

---

## Diapo 12 — Qualité & livraison automatisée *(~1 min)*

**Diapo :**
- Pipeline : code → tests automatiques → images → déploiement.
- Chiffres : nombre de tests, gate de couverture.

**À dire :**
- À chaque modification, des **tests automatiques** vérifient que rien n'est cassé.
- Si les tests passent, l'appli est **construite et publiée automatiquement**.
- Bénéfice : **livrer souvent et sans peur** → time-to-market réduit.

---

## Diapo 13 — Bilan, coûts & prochaines étapes *(~1,5 min)*

**Diapo :**
- Récap des 3 promesses tenues : **Fiabilité · Vitesse · Maîtrise des coûts**.
- Roadmap courte (3 puces) + le « ask » (ce que vous demandez).

**À dire :**
- On a démontré une architecture **résiliente, rapide à livrer, et économe**.
- Prochaines étapes possibles : state Terraform distant, push images vers l'ACR, alerting avancé.
- **Ce que je propose :** appliquer ces fondations à un vrai produit / un budget de test cloud.
- Clôture : « Une base technique solide, ce n'est pas un coût — c'est ce qui permet d'aller vite **longtemps**. »

---

## Annexes & conseils de présentation

- **Timing total :** ~15 min. Gardez 1–2 min de marge pour les questions.
- **Un message par diapo.** Si une diapo a deux idées, coupez-la en deux.
- **Traduisez chaque terme technique** par une image (gateway = accueil, cache = mémoire courte,
  bus = boîte aux lettres, IaC = plan de montage).
- **Visuels > texte :** privilégiez schémas, captures (dashboard Grafana, appli), avant/après.
- **Démo live (optionnelle, ~1 min) :** si le temps le permet, montrez `terraform destroy` ou
  l'autoscaling — l'effet « waouh » sur une audience non technique.
- **Questions probables non techniques + réponses courtes :**
  - *« Combien ça coûte ? »* → on paie à l'usage, et on éteint tout après la démo.
  - *« Est-ce risqué ? »* → modules isolés + tests auto + monitoring → risque maîtrisé.
  - *« Pourquoi pas plus simple ? »* → la simplicité d'un bloc unique se paie en pannes et en lenteur dès que ça grossit.
- **Sources internes** pour préparer : [README](../README.md) et les
  [ADR](adr/) (chaque décision y est justifiée — utile pour les questions pointues).
