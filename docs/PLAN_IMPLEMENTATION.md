# Plan d'Implémentation - Boutons Kontiq

## Structure des fichiers JavaScript

### 1. **app.js** (Gestion globale)
- Initialisation de l'app
- Navigation entre les pages
- Gestion de la session utilisateur
- Fonction `navigateTo(view)` pour changer de page

### 2. **api-client.js** (Client API centralisé)
- Fonctions FETCH pour toutes les routes API
- Gestion des erreurs centralisée
- Fonctions réutilisables : `fetchAPI(endpoint, method, data)`

### 3. **Fichiers par page** 

#### **dashboard.js**
Aucun bouton spécifique à implémenter sur la page dashboard

#### **zahlungen.js** (Paiements)
- Charger la liste des paiements
- Boutons de filtrage/tri

#### **liquiditat.js** (Liquidité)
- `openCreditSimulator()` - Ouvre modal de simulation crédit vs skonto
- `closeModal()` - Ferme la modal
- "Export" - Exporte en PDF/Excel
- "Überweisung vorbereiten" - Prépare un virement
- "Rechnung erstellen" - Crée une facture
- "Export wird vorbereitet" - Prépare export
- "Kontoübersicht öffnen" - Ouvre aperçu des comptes

#### **vertrage.js** (Contrats)
- `openUploadModal()` - Ouvre modal upload contrats
- `closeUploadModal()` - Ferme modal
- `switchTab(tab)` - Change d'onglet (all, active, expiring, compare)
- `closeDetailsModal()` - Ferme détails
- `editContract()` - Édite un contrat
- Upload de fichiers

#### **forderungen.js** (Créances)
- Charger les créances
- Statut des créances
- Actions sur créances

#### **kosten.js** (Coûts)
- Charger les coûts
- Ajouter catégories de coûts
- Supprimer catégories

#### **kpis.js** (KPIs)
- Charger et afficher KPIs
- Actualiser données

#### **reports.js** (Rapports)
- Générer rapports
- Exporter rapports
- Filtrer par période

#### **bankkonten.js** (Comptes bancaires)
- Charger les comptes
- Ajouter/éditer/supprimer comptes
- Synchroniser avec API

#### **einstellungen.js** (Paramètres)
- Charger paramètres utilisateur
- Sauvegarder paramètres
- Changer mot de passe

#### **entitaeten.js** (Entités)
- Gérer entités légales
- CRUD opérations

#### **abonnement.js** (Abonnement)
- Afficher statut abonnement
- Gestion tarifs

---

## Routes API à créer dans server.js

### Export & Documents
```
POST /api/export/pdf - Exporte en PDF
POST /api/export/excel - Exporte en Excel
POST /api/documents/upload - Upload documents
GET /api/documents - Liste documents
```

### Liquidité
```
POST /api/credit-simulator - Simulation crédit vs skonto
```

### Contrats
```
GET /api/contracts - Liste des contrats
POST /api/contracts - Crée un contrat
PUT /api/contracts/:id - Édite un contrat
DELETE /api/contracts/:id - Supprime un contrat
POST /api/contracts/upload - Upload contrats
```

### Paiements
```
GET /api/zahlungen - Liste paiements
POST /api/zahlungen - Crée paiement
PUT /api/zahlungen/:id - Édite paiement
```

### Comptes bancaires
```
GET /api/bankkonten - Liste comptes
POST /api/bankkonten - Crée compte
PUT /api/bankkonten/:id - Édite compte
DELETE /api/bankkonten/:id - Supprime compte
```

### Créances
```
GET /api/forderungen - Liste créances
POST /api/forderungen - Crée créance
PUT /api/forderungen/:id - Édite créance
```

### Coûts
```
GET /api/kosten - Liste coûts
POST /api/kosten - Crée coût
DELETE /api/kosten/:id - Supprime coût
```

---

## Étapes d'implémentation

1. ✅ Créer structure fichiers JS
2. ✅ Implémenter api-client.js
3. ✅ Implémenter app.js
4. ✅ Implémenter chaque module JS par page
5. Ajouter routes API dans server.js
6. Tester les boutons
7. Ajouter persistance données (JSON files)
8. Ajouter validations

---

## Architecture de données

### Data structure pour chaque entité:

```json
{
  "contracts": [],
  "payments": [],
  "accounts": [],
  "costs": [],
  "invoices": []
}
```

Chaque objet contient:
- `id` - UUID ou incremental
- `timestamp` - Date création
- `userId` - ID utilisateur
- Propriétés spécifiques à l'entité

