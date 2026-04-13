# ADR-001 — Extraction d'une couche service backend

**Status :** Accepté  
**Date :** 2026-04-15

---

## Contexte

Les routes Express originales (`addItem.js`, `updateItem.js`, etc.) mélangeaient trois responsabilités distinctes :
- Parsing de la requête HTTP (`req.body`)
- Logique métier (validation, génération d'UUID)
- Appel direct à la couche de persistance

Ce couplage rendait impossible de tester la logique métier sans passer par une vraie requête HTTP, et sans mocker la couche de persistance au niveau des routes.

## Décision

Créer un module `src/services/itemService.js` qui centralise toute la logique métier :
- Validation des entrées (`name` requis, max 255 caractères, trim)
- Génération de l'UUID
- Délégation à `src/persistence`

Les routes deviennent de simples adaptateurs HTTP : elles extraient les données de `req`, appellent le service, et renvoient la réponse avec le bon code HTTP dans un bloc `try/catch`.

## Conséquences

**Positives :**
- Les tests unitaires du service peuvent mocker uniquement la couche de persistance (pas HTTP).
- Les tests des routes peuvent mocker uniquement le service (pas la DB).
- La logique métier est réutilisable si le transport change (REST → gRPC, CLI, etc.).
- Le code d'erreur HTTP est géré à un seul endroit par route.

**Négatives / compromis :**
- Une indirection supplémentaire pour des routes simples.
- Pour ce projet de taille réduite, la couche service reste légère — si la logique métier ne croît pas, ce découpage peut sembler prématuré.
