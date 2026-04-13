# ADR-002 — Double driver de persistance : SQLite et MySQL

**Status :** Accepté (hérité du projet original)  
**Date :** 2026-04-15

---

## Contexte

L'application doit fonctionner dans deux contextes :
- **Développement local / CI léger** : sans serveur de base de données externe. SQLite écrit dans un fichier local.
- **Production / Docker Compose complet** : avec un serveur MySQL dédié pour la durabilité et le partage entre plusieurs instances.

## Décision

Conserver deux implémentations distinctes dans `src/persistence/` (`sqlite.js` et `mysql.js`), sélectionnées au runtime via `src/persistence/index.js` :

```js
if (process.env.MYSQL_HOST) module.exports = require('./mysql');
else module.exports = require('./sqlite');
```

Le choix se fait à l'initialisation : si `MYSQL_HOST` est défini, MySQL est utilisé ; sinon, SQLite est la valeur par défaut.

Les deux implémentations exposent la même interface (`init`, `teardown`, `getItems`, `storeItem`, `updateItem`, `removeItem`), ce qui permet au reste de l'application de rester agnostique.

## Conséquences

**Positives :**
- Zéro configuration pour un démarrage rapide en développement.
- Le code applicatif (routes, service) ne sait pas quelle DB est utilisée.
- Les credentials MySQL peuvent être injectés via Docker secrets (fichiers) ou variables d'environnement.

**Négatives / risques :**
- Les deux implémentations peuvent diverger subtilement (gestion des booléens, types SQL). Des tests d'intégration contre les deux backends sont nécessaires pour garantir la parité.
- `MYSQL_HOST` absent = SQLite silencieusement. Un opérateur qui oublie la variable ne verra pas d'erreur explicite.
- Le schéma SQLite ne fait pas respecter `varchar(255)` — la validation doit être faite au niveau applicatif (ce qu'assure `itemService.js`).
