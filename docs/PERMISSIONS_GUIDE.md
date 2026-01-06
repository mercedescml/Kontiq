# 🔐 Système de Permissions Granulaires - Kontiq

## Vue d'ensemble

Le système de permissions de Kontiq offre un contrôle granulaire sur qui peut voir et modifier quoi dans l'application. Il est basé sur deux niveaux :

### 1. **Permissions Globales**
Définies par le **Geschäftsführer** (Directeur Général) pour tous les utilisateurs au niveau système.

### 2. **Permissions par Entité**
Définies par le **Geschäftsführer** ou le **Manager d'une entité** pour contrôler l'accès spécifique à une entité.

---

## Rôles

### 🏆 Geschäftsführer (Directeur Général)
- **Accès complet** à tout le système
- Peut définir toutes les permissions globales
- Peut définir les permissions pour toutes les entités
- Peut créer et supprimer des entités
- Peut désigner des managers d'entités

### 👔 Manager
- Accès étendu aux modules assignés
- Si désigné comme manager d'une entité, peut :
  - Définir les permissions pour son entité
  - Inviter des utilisateurs à son entité
  - Gérer qui voit quoi dans son entité

### 👤 Standard
- Accès selon les permissions définies
- Peut avoir des permissions globales
- Peut être invité à des entités spécifiques avec des permissions particulières

---

## Modules et Permissions

Pour chaque module, deux types de permissions :

### 📊 Modules disponibles
- **Entitäten** (Entités) - Gestion des entités d'entreprise
- **Bankkonten** (Comptes bancaires) - Gestion des comptes
- **Kosten** (Coûts) - Gestion des coûts
- **Forderungen** (Créances) - Gestion des créances
- **Zahlungen** (Paiements) - Gestion des paiements
- **Verträge** (Contrats) - Gestion des contrats
- **Liquidität** (Liquidité) - Tableau de liquidité
- **Reports** (Rapports) - Génération de rapports
- **KPIs** (Indicateurs) - Tableau de bord KPI
- **Einstellungen** (Paramètres) - Configuration système

### 🔑 Types de permissions par module
- **View (Voir)** - Peut consulter les données
- **Edit (Modifier)** - Peut créer, modifier et supprimer

---

## Comment ça fonctionne

### Scénario 1 : Permissions Globales
```
Geschäftsführer définit :
├─ Jean : Manager
│  ├─ Bankkonten : View + Edit
│  ├─ Kosten : View + Edit
│  └─ Zahlungen : View only
│
└─ Marie : Standard
   ├─ Forderungen : View + Edit
   └─ Reports : View only
```

**Résultat** : Jean et Marie voient uniquement leurs modules assignés dans la navigation.

### Scénario 2 : Permissions par Entité
```
Entité : "Filiale Paris"
Manager : Jean

Jean invite Marie à "Filiale Paris" :
├─ Bankkonten : View only
├─ Kosten : View + Edit
└─ Forderungen : View only
```

**Résultat** : Marie peut voir les données de la Filiale Paris uniquement avec les permissions définies par Jean.

### Scénario 3 : Combinaison
```
Marie a :
├─ Permissions Globales (définies par Geschäftsführer)
│  ├─ Forderungen : View + Edit (global)
│  └─ Reports : View (global)
│
└─ Permissions Entité "Filiale Lyon" (définies par Manager)
   ├─ Bankkonten : View (Lyon seulement)
   └─ Kosten : View + Edit (Lyon seulement)
```

**Résultat** : Marie peut gérer les Forderungen partout, voir les Reports partout, et accéder aux Bankkonten/Kosten uniquement pour la Filiale Lyon.

---

## API Endpoints

### Récupérer les permissions d'un utilisateur
```
GET /api/permissions/user/:email
```

### Définir des permissions globales (Geschäftsführer uniquement)
```
POST /api/permissions/global
Body: {
  "adminEmail": "admin@example.com",
  "targetEmail": "user@example.com",
  "permissions": {
    "role": "manager",
    "permissions": {
      "bankkonten": { "view": true, "edit": true },
      "kosten": { "view": true, "edit": false }
    }
  }
}
```

### Définir des permissions par entité
```
POST /api/permissions/entity
Body: {
  "adminEmail": "admin@example.com",
  "entityId": "entity123",
  "targetEmail": "user@example.com",
  "permissions": {
    "permissions": {
      "bankkonten": { "view": true, "edit": false }
    }
  }
}
```

### Supprimer des permissions
```
DELETE /api/permissions/:type/:email?adminEmail=xxx&entityId=xxx
```

### Lister tous les utilisateurs avec permissions (Geschäftsführer)
```
GET /api/permissions/all?email=admin@example.com
```

---

## Utilisation dans le Code

### Initialiser le gestionnaire de permissions
```javascript
// Dans chaque page
const perms = new PermissionsManager();
await perms.init();
```

### Vérifier les permissions
```javascript
// Vérifier si l'utilisateur peut voir un module
if (perms.canView('bankkonten')) {
  // Afficher les données
}

// Vérifier si l'utilisateur peut modifier
if (perms.canEdit('kosten', entityId)) {
  // Activer l'édition
}

// Vérifier et afficher erreur si pas de permission
if (!perms.requirePermission('zahlungen', 'edit')) {
  return; // Message d'erreur déjà affiché
}
```

### Appliquer les permissions à l'UI
```html
<!-- Cacher un bouton si pas de permission edit -->
<button data-permission-edit="bankkonten">Modifier</button>

<!-- Cacher une section si pas de permission view -->
<div data-permission-view="kosten">
  <!-- Contenu -->
</div>

<!-- Désactiver un input si pas de permission edit -->
<input data-permission-input="forderungen" />

<!-- Avec entité spécifique -->
<button data-permission-edit="bankkonten" data-entity-id="entity123">
  Modifier
</button>
```

```javascript
// Appliquer automatiquement
perms.applyToUI();
```

---

## Interface Utilisateur

### Accéder à la gestion des permissions
1. Se connecter en tant que Geschäftsführer
2. Aller dans **Einstellungen** (Paramètres)
3. Cliquer sur **Berechtigungen** (Permissions)

OU

Accéder directement : `http://localhost:3000/views/permissions.html`

### Gérer les permissions globales
1. Onglet **"Globale Berechtigungen"**
2. Cliquer sur **"Benutzer hinzufügen"**
3. Sélectionner l'utilisateur
4. Choisir le rôle (Geschäftsführer, Manager, Standard)
5. Cocher les permissions pour chaque module
6. Sauvegarder

### Gérer les permissions par entité
1. Onglet **"Entitäten-Berechtigungen"**
2. Cliquer sur une entité existante OU créer une nouvelle
3. Sélectionner un utilisateur à inviter
4. Définir les permissions spécifiques
5. Sauvegarder

---

## Structure des Données

### permissions.json
```json
{
  "globalPermissions": {
    "user@example.com": {
      "role": "manager",
      "permissions": {
        "bankkonten": { "view": true, "edit": true },
        "kosten": { "view": true, "edit": false }
      }
    }
  },
  "entityPermissions": {
    "entity123": {
      "user@example.com": {
        "permissions": {
          "bankkonten": { "view": true, "edit": false }
        }
      }
    }
  },
  "invitations": []
}
```

---

## Sécurité

### Côté Serveur
- ✅ Toutes les API vérifient les permissions avant d'exécuter
- ✅ Seul le Geschäftsführer peut modifier les permissions globales
- ✅ Les managers ne peuvent gérer que leurs entités
- ✅ Les permissions sont vérifiées à chaque requête

### Côté Client
- ✅ Les éléments UI sont cachés/désactivés selon les permissions
- ✅ Les permissions sont stockées en cache pour performance
- ✅ Les actions non autorisées affichent un message d'erreur
- ⚠️ **Important** : La sécurité UI est pour UX, la vraie sécurité est côté serveur

---

## Cas d'Usage Typiques

### Cas 1 : Comptable externe
```javascript
Permissions :
- Forderungen : View + Edit
- Zahlungen : View + Edit
- Reports : View
- Tout le reste : Aucun accès
```

### Cas 2 : Manager de filiale
```javascript
Permissions Globales :
- Reports : View

Permissions Filiale "Paris" :
- Tous les modules : View + Edit (pour sa filiale uniquement)
```

### Cas 3 : Assistant administratif
```javascript
Permissions :
- Tous les modules : View only
- Forderungen : View + Edit (pour saisie de données)
```

---

## Migration depuis un système de rôles

Si vous aviez un système basé uniquement sur des rôles :

### Avant
```javascript
if (user.role === 'admin') {
  // Full access
}
```

### Maintenant
```javascript
if (perms.isGeschaeftsfuehrer()) {
  // Full access
} else if (perms.canEdit('bankkonten')) {
  // Can edit bank accounts
}
```

---

## Support et Questions

Pour toute question sur le système de permissions, contactez l'équipe technique Kontiq.

**Dernière mise à jour** : 4 janvier 2026
