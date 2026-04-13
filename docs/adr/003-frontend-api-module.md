# ADR-003 — Centralisation des appels réseau dans un module API frontend

**Status :** Accepté  
**Date :** 2026-04-15

---

## Contexte

Dans la version originale, les composants React (`TodoListCard.jsx`, `ItemDisplay.jsx`) effectuaient directement des appels `fetch` en ligne. Cela créait plusieurs problèmes :
- L'URL de base `/api/items` était dupliquée dans chaque composant.
- La gestion des erreurs HTTP (vérification de `res.ok`, parsing du body d'erreur) était dispersée.
- Tester un composant nécessitait de mocker `fetch` globalement et de connaître les détails du protocole HTTP.

## Décision

Créer `src/api/todoApi.js` comme unique point d'accès au backend :

```js
export async function fetchItems() { ... }
export async function createItem(name) { ... }
export async function updateItem(id, data) { ... }
export async function deleteItem(id) { ... }
```

Les composants importent uniquement les fonctions dont ils ont besoin. Le hook `useTodoList` orchestre l'état en appelant `fetchItems` et en exposant les callbacks (`onNewItem`, `onItemUpdate`, `onItemRemoval`).

## Conséquences

**Positives :**
- L'URL de base est définie à un seul endroit (`const BASE = '/api/items'`).
- La gestion des erreurs HTTP est centralisée et cohérente (ex : extraction du message d'erreur du body JSON pour `createItem`).
- Les tests unitaires des composants peuvent mocker le module `todoApi` sans toucher à `fetch`.
- Si l'API change (nouvelle URL, nouveau header d'auth), un seul fichier est à modifier.

**Négatives / compromis :**
- Une indirection supplémentaire pour des projets très simples.
- Le module est synchrone par nature (pas de cache, pas de retry) — acceptable pour ce projet, mais à revoir si les besoins évoluent.
