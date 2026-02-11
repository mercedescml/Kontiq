# KONTIQ - Architecture Complète & Logique Métier

**Documentation technique complète pour développeur**
Version actuelle du système fonctionnel

---

## 📋 SOMMAIRE

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Modèles de données](#modèles-de-données)
4. [Modules & Corrélations](#modules--corrélations)
5. [Flux de données](#flux-de-données)
6. [Système de permissions](#système-de-permissions)
7. [Logique métier](#logique-métier)
8. [Features principales](#features-principales)

---

## 🎯 VUE D'ENSEMBLE

### Qu'est-ce que Kontiq?

**Kontiq** est une application de gestion financière pour PME suisses, permettant de gérer:
- **Trésorerie** (Bankkonten, Liquidität)
- **Paiements sortants** (Zahlungen avec catégorisation)
- **Créances entrantes** (Forderungen avec catégorisation)
- **Coûts** (Kosten)
- **Contrats** (Verträge)
- **Entités multi-sociétés** (Entitäten)
- **Utilisateurs & Permissions** (hiérarchie Geschäftsführer > Manager > Employee)
- **Reporting & KPIs** (Dashboard, Reports, KPIs)

### Contexte métier

- **Monnaie**: CHF (Franc Suisse)
- **Langue**: Allemand (interface)
- **Convention de nommage**: snake_case pour les données JSON/API
- **Architecture**: SPA (Single Page Application) vanilla JS

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack technique actuel

```
Frontend:
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Pas de framework (React/Vue/Angular)
- Navigation SPA avec fragment loading

Backend simulation:
- API REST simulée (/api/*)
- Stockage JSON fichiers (/data/*.json)
- JWT pour l'authentification

Performance:
- DataPreloader: cache en mémoire pour affichage instantané
- View caching: HTML des pages en cache
- Script prefetching: chargement anticipé des JS
```

### Structure de fichiers

```
/public
  /views/         → HTML fragments pour chaque page
  /js/            → Logique métier par module
  /css/           → Styles globaux et par module
  /data/          → JSON storage (simulation DB)

Fichiers clés:
- app.js          → Navigation SPA, routing, session
- api-client.js   → Client API centralisé
- helpers.js      → Fonctions génériques (cache, modals)
- data-preloader.js → Cache système
- permissions-manager.js → Logique RBAC
```

### Navigation SPA

```javascript
// Fragment-based routing
APP.loadView('dashboard')  // Charge /views/dashboard.html
  → Injecte HTML dans <main id="content">
  → Charge /js/dashboard.js si pas déjà chargé
  → Appelle init function du module
  → Update navigation active state
```

---

## 📊 MODÈLES DE DONNÉES

### 1. Users (Utilisateurs)

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "company": "My Company",
  "passwordHash": "sha256...",
  "role": "geschaeftsfuehrer",  // ou "manager" ou "employee"
  "managedEntityIds": ["1", "2"],    // Entités gérées (pour managers)
  "accessibleEntityIds": ["1", "2", "3"],  // Entités accessibles
  "permissions": {
    "dashboard": { "view": true, "edit": true },
    "zahlungen": { "view": true, "edit": true },
    "forderungen": { "view": true, "edit": false }
  },
  "created": "2026-01-01T00:00:00.000Z"
}
```

### 2. Entitäten (Entités/Sociétés)

```json
{
  "id": "1",
  "name": "KontiQ GmbH",
  "manager": "christianmeli71@gmail.com",
  "managers": ["christianmeli71@gmail.com", "other@example.com"],
  "type": "hauptsitz",  // ou "standard"
  "created": "2026-01-02T23:16:07.977Z"
}
```

**Logique**:
- Un Geschäftsführer voit TOUTES les entités
- Un Manager ne voit que SES entités (où il est manager)
- Les données (bankkonten, zahlungen, etc.) sont filtrées par entityIds

### 3. Bankkonten (Comptes bancaires)

```json
{
  "id": "BK-001",
  "name": "Compte principal UBS",
  "bank": "UBS Switzerland AG",
  "iban": "CH93 0076 2011 6238 5295 7",
  "balance": 125430.50,
  "type": "primary",  // ou "savings", "business"
  "entityIds": ["1", "2"],  // Entités ayant accès
  "created": "2026-01-01T00:00:00.000Z"
}
```

**Logique de filtrage**:
- `entityIds: ["all"]` → Visible par tous
- `entityIds: ["1", "2"]` → Visible uniquement par entités 1 et 2
- Manager ne voit que les comptes de SES entités

### 4. Zahlungen (Paiements sortants)

```json
{
  "id": "ZAH-001",
  "supplier": "Büromöbel Schmidt GmbH",
  "amount": 2500.00,
  "date": "2026-01-10",
  "due_date": "2026-01-20",
  "status": "pending",  // ou "completed", "failed"
  "category": "ZKAT-001",  // FK vers zahlungen_kategorien
  "skonto": 2.0,           // Pourcentage de remise
  "skonto_deadline": "2026-01-15",
  "description": "Mobilier de bureau",
  "created_at": "2026-01-05T10:00:00.000Z"
}
```

**Catégories de paiements** (zahlungen_kategorien.json):
```json
{
  "id": "ZKAT-001",
  "name": "Wareneinkauf",
  "description": "Einkauf von Waren, Material und Produkten",
  "color": "#1976d2",
  "icon": "shopping-cart",
  "priority": "high",  // "critical", "high", "medium", "low"
  "isDefault": true
}
```

**12 catégories par défaut**:
- ZKAT-001: Wareneinkauf
- ZKAT-002: Personal (salaires)
- ZKAT-003: Miete & Nebenkosten
- ZKAT-004: Energie & Versorgung
- ZKAT-005: IT & Software
- ZKAT-006: Marketing & Werbung
- ZKAT-007: Versicherungen
- ZKAT-008: Fahrzeuge & Transport
- ZKAT-009: Steuern & Abgaben
- ZKAT-010: Beratung & Dienstleistungen
- ZKAT-011: Wartung & Reparaturen
- ZKAT-012: Bürobedarf & Ausstattung

### 5. Forderungen (Créances entrantes)

```json
{
  "id": "FOR-001",
  "client_name": "ABC Solutions AG",
  "amount": 15800.00,
  "invoice_date": "2026-01-15",
  "due_date": "2026-02-15",
  "status": "open",  // ou "paid", "overdue"
  "category": "CAT-001",  // FK vers forderungen_kategorien
  "description": "Projet consultation Q1 2026"
}
```

**Catégories de créances** (forderungen_kategorien.json):
```json
{
  "id": "CAT-001",
  "name": "Projektarbeit",
  "description": "Einnahmen aus abgeschlossenen Projekten",
  "color": "#1976d2",
  "icon": "briefcase",
  "isDefault": true
}
```

**6 catégories par défaut**:
- CAT-001: Projektarbeit
- CAT-002: Wartung & Service
- CAT-003: Beratung
- CAT-004: Materialverkauf
- CAT-005: Miete & Leasing
- CAT-006: Lizenzgebühren

### 6. Kosten (Coûts)

```json
{
  "id": "KOS-001",
  "category": "IT",
  "description": "Serveur AWS mensuel",
  "amount": 450.00,
  "date": "2026-01-01",
  "status": "paid"
}
```

### 7. Verträge (Contrats)

```json
{
  "id": "VER-001",
  "name": "Mietvertrag Bürofläche",
  "partner": "Immobilien Schmidt GmbH",
  "startDate": "2024-01-01",
  "endDate": "2026-12-31",
  "amount": 2500,  // Montant mensuel/annuel
  "status": "active",  // ou "expiring", "expired"
  "description": "Büro im 3. Stock, 120m², inkl. Nebenkosten"
}
```

---

## 🔗 MODULES & CORRÉLATIONS

### Hiérarchie des modules

```
┌─────────────────────────────────────────────┐
│          APP.JS (Navigation SPA)            │
│  - Routing                                  │
│  - Session management                       │
│  - View caching                             │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ API-CLIENT   │        │ DATA-        │
│              │        │ PRELOADER    │
│ Centralisé   │◄───────┤ Cache global │
└──────────────┘        └──────────────┘
        │
        ├────────────────────────────────────────┐
        │                                        │
┌───────▼────────┐                    ┌─────────▼─────────┐
│ PERMISSIONS-   │                    │ HELPERS.JS        │
│ MANAGER        │                    │ - loadDataWithCache│
│ RBAC Logic     │                    │ - createGenericModal│
└────────────────┘                    └───────────────────┘
        │
        ├──────────┬──────────┬──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼          ▼          ▼
    Dashboard  Zahlungen  Forderungen  Kosten  Bankkonten  Entitäten
        ▼          ▼          ▼          ▼          ▼          ▼
    Liquidität  Verträge    KPIs     Reports  Einstellungen
```

### Dépendances entre modules

#### 1. **Dashboard** (hub central)

**Dépend de**:
- `bankkonten` → Solde total
- `zahlungen` → Paiements en attente
- `forderungen` → Créances ouvertes
- `kosten` → Coûts du mois

**Calculs KPI**:
```javascript
// Charge TOUTES les données en parallèle
Promise.all([
  loadBankkonten(),
  loadZahlungen(),
  loadForderungen(),
  loadKosten()
])

// Calcule les métriques
totalBalance = sum(bankkonten.balance)
pendingPayments = filter(zahlungen, status='pending')
openInvoices = filter(forderungen, status='open')
monthCosts = filter(kosten, current_month)
```

#### 2. **Zahlungen** (paiements)

**Dépend de**:
- `zahlungen_kategorien` → Pour afficher le nom et couleur de catégorie

**Utilisé par**:
- `Dashboard` → KPIs paiements
- `Liquidität` → Projection trésorerie
- `Zahlungsaufschieb-Simulator` → Simulation report de paiement

**Flux de données**:
```javascript
// Au chargement
loadZahlungenKategorien()  // D'abord les catégories
  .then(() => loadZahlungen())  // Puis les paiements
  .then(() => displayPayments(payments))

// Affichage
payments.forEach(p => {
  const category = kategorien.find(k => k.id === p.category)
  display(p.supplier, p.amount, category.name, category.color)
})
```

#### 3. **Forderungen** (créances)

**Dépend de**:
- `forderungen_kategorien` → Pour catégoriser les revenus

**Utilisé par**:
- `Dashboard` → KPIs créances
- `Liquidität` → Projection encaissements

**Logique métier**:
- Status `overdue` calculé dynamiquement si `due_date < today`
- Alertes pour créances > 30 jours

#### 4. **Bankkonten** (comptes bancaires)

**Dépend de**:
- `entitaeten` → Pour filtrer par entités accessibles
- `users` (currentUser) → Pour permissions RBAC

**Utilisé par**:
- `Dashboard` → Solde total
- `Liquidität` → Disponibilités

**Logique de filtrage**:
```javascript
// Manager ne voit que SES entités
if (user.role === 'manager') {
  userEntityIds = entitaeten
    .filter(e => e.manager === user.email)
    .map(e => e.id)

  bankkonten = bankkonten.filter(k =>
    k.entityIds.includes('all') ||
    k.entityIds.some(id => userEntityIds.includes(id))
  )
}
// Geschäftsführer voit tout
```

#### 5. **Entitäten** (entités multi-sociétés)

**Utilisé par**:
- `Bankkonten` → Filtrage par entités
- `Zahlungen` → Filtrage par entités (optionnel)
- `Permissions-Manager` → Assignation de permissions

**Logique**:
- Chaque utilisateur a `accessibleEntityIds`
- Les managers peuvent créer des sous-managers pour LEURS entités
- Type `hauptsitz` vs `standard` (peut influencer reporting)

#### 6. **Liquidität** (trésorerie)

**Dépend de**:
- `bankkonten` → Soldes actuels
- `zahlungen` (pending) → Sorties prévues
- `forderungen` (open) → Entrées prévues

**Calculs de projection**:
```javascript
// Trésorerie actuelle
current = sum(bankkonten.balance)

// Projection 30 jours
upcoming_in = sum(forderungen where status='open' AND due_date < today+30)
upcoming_out = sum(zahlungen where status='pending' AND due_date < today+30)

projected = current + upcoming_in - upcoming_out
```

#### 7. **Verträge** (contrats)

**Indépendant** (pas de dépendances directes)

**Utilisé par**:
- `Dashboard` → Alertes contrats expirants

**Logique**:
- Status `expiring` si `endDate < today + 60 days`
- Génère automatiquement des paiements récurrents (futur)

#### 8. **KPIs & Reports**

**Dépend de** (TOUTES les données):
- `zahlungen` → Analyse dépenses par catégorie
- `forderungen` → Analyse revenus
- `kosten` → Analyse coûts
- `bankkonten` → Évolution trésorerie
- `entitaeten` → Segmentation par entité

**Exports**:
- PDF
- Excel
- Filtrage par période, entité, catégorie

---

## 🌊 FLUX DE DONNÉES

### Chargement d'une page type

```
1. User clique navigation "Zahlungen"
   ↓
2. APP.loadView('zahlungen')
   ↓
3. Fetch /views/zahlungen.html (ou cache)
   ↓
4. Inject HTML dans <main id="content">
   ↓
5. Load /js/zahlungen.js (ou cache)
   ↓
6. Execute init function:
   - loadZahlungenKategorien() (si pas déjà chargées)
   - loadZahlungen() via loadDataWithCache()
   ↓
7. loadDataWithCache('zahlungen'):
   - Check DataPreloader.cache
   - Si cache HIT → return immédiat
   - Si cache MISS → API.zahlungen.getAll()
   ↓
8. displayPayments(data)
   - Build HTML table
   - Apply status badges
   - Show category colors
   ↓
9. User voit les données instantanément
```

### Création d'une nouvelle donnée

```
1. User clique "Nouvelle Zahlung"
   ↓
2. openPaymentModal()
   - createGenericModal() si pas déjà créée
   - Show modal avec formulaire vide
   ↓
3. User remplit formulaire
   - supplier: "ABC GmbH"
   - amount: 5000
   - category: ZKAT-002 (Personal)
   - due_date: 2026-02-15
   ↓
4. User clique "Speichern"
   ↓
5. savePayment(event)
   - Validate form
   - Extract data from fields
   - Call API.zahlungen.create(data)
   ↓
6. API POST /api/zahlungen
   - Backend crée nouvelle entrée
   - Generate ID: "ZAH-007"
   - Save to data/zahlungen.json
   - Return created object
   ↓
7. Success callback:
   - APP.notify('Zahlung erstellt', 'success')
   - closePaymentModal()
   - loadZahlungen() → refresh table
   - DataPreloader.cache invalidé
   ↓
8. Table se rafraîchit avec nouvelle ligne
```

### Synchronisation Dashboard

```
Dashboard init:
  ↓
  ├─→ loadBankkonten() ────┐
  ├─→ loadZahlungen() ─────┤
  ├─→ loadForderungen() ───┤→ Promise.all()
  └─→ loadKosten() ────────┘
           ↓
  calculateMetrics():
    - totalBalance = sum(bankkonten)
    - pendingAmount = sum(zahlungen where pending)
    - openInvoices = sum(forderungen where open)
    - monthCosts = sum(kosten where current_month)
           ↓
  displayDashboard(metrics)
```

---

## 🔐 SYSTÈME DE PERMISSIONS

### Hiérarchie des rôles

```
┌─────────────────────────────────┐
│     Geschäftsführer (Admin)     │  ← Accès total, voit tout
├─────────────────────────────────┤
│  - Voit TOUTES les entités      │
│  - Peut créer Geschäftsführer,  │
│    Managers, Employees          │
│  - Peut modifier tout           │
└─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│          Manager                │  ← Gère ses entités
├─────────────────────────────────┤
│  - Voit SES entités uniquement  │
│  - Peut créer Managers,         │
│    Employees pour ses entités   │
│  - Peut modifier data de ses    │
│    entités                      │
└─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│         Employee                │  ← Accès limité
├─────────────────────────────────┤
│  - Voit entités assignées       │
│  - Ne peut pas inviter          │
│  - Accès lecture principalement │
└─────────────────────────────────┘
```

### Logique de filtrage des données

**Exemple: Bankkonten (comptes bancaires)**

```javascript
async function loadBankkonten() {
  // 1. Charger TOUTES les données
  let allBankkonten = await loadDataWithCache('bankkonten', null, 'bankkonten')

  // 2. Filtrer selon le rôle
  if (currentUser.role !== 'geschaeftsfuehrer') {
    // Manager: ne voit que SES entités
    const userEntities = currentEntities.filter(e =>
      e.manager === currentUser.email ||
      (e.managers && e.managers.includes(currentUser.email))
    )
    const userEntityIds = userEntities.map(e => e.id)

    allBankkonten = allBankkonten.filter(k =>
      k.entityIds && (
        k.entityIds.includes('all') ||
        k.entityIds.some(id => userEntityIds.includes(id))
      )
    )
  }
  // Geschäftsführer: voit tout (pas de filtre)

  // 3. Afficher
  currentBankkonten = allBankkonten
  displayBankkonten(currentBankkonten)
}
```

### Permissions par module

```javascript
user.permissions = {
  "dashboard": { "view": true, "edit": false },
  "zahlungen": { "view": true, "edit": true },
  "forderungen": { "view": true, "edit": true },
  "kosten": { "view": true, "edit": false },
  "bankkonten": { "view": true, "edit": false },
  "vertrage": { "view": true, "edit": true },
  "entitaeten": { "view": false, "edit": false },
  "kpis": { "view": true, "edit": false },
  "reports": { "view": true, "edit": false },
  "einstellungen": { "view": true, "edit": false }
}
```

**Vérification avant affichage**:
```javascript
// Dans navigation
if (PermissionsManager.canView(currentUser, 'zahlungen')) {
  showNavLink('zahlungen')
}

// Dans action
if (PermissionsManager.canEdit(currentUser, 'zahlungen')) {
  showEditButton()
}
```

---

## ⚙️ LOGIQUE MÉTIER

### 1. Catégorisation intelligente

**Zahlungen (Paiements)**:
- 12 catégories prédéfinies avec priorités
- Couleurs et icônes pour visualisation
- Utilisé pour:
  - Reporting par catégorie
  - Budget vs réel
  - Prévisions de dépenses

**Forderungen (Créances)**:
- 6 catégories de revenus
- Analyse de rentabilité par type
- Suivi des sources de revenus

### 2. Gestion du Skonto (remise de paiement anticipé)

**Concept**: Remise offerte si paiement avant une date

```javascript
payment = {
  amount: 10000,
  due_date: "2026-02-15",
  skonto: 2.0,  // 2%
  skonto_deadline: "2026-01-25"
}

// Si payé avant 2026-01-25:
payment_with_skonto = 10000 * (1 - 0.02) = 9800 CHF

// Si payé après 2026-01-25 mais avant 2026-02-15:
payment_normal = 10000 CHF
```

**Simulateur de report de paiement**:
- Compare coût du crédit vs économie du skonto
- Aide à décider: payer maintenant avec skonto ou plus tard?

### 3. Détection des créances en retard

```javascript
forderungen.forEach(f => {
  const today = new Date()
  const dueDate = new Date(f.due_date)

  if (f.status === 'open' && dueDate < today) {
    f.status = 'overdue'
    f.days_overdue = daysBetween(dueDate, today)

    if (f.days_overdue > 30) {
      triggerAlert('Créance en retard > 30 jours')
    }
  }
})
```

### 4. Projection de trésorerie

**Liquidität module**:

```javascript
// Trésorerie actuelle
current_balance = sum(bankkonten.balance)

// Entrées prévues (30 jours)
upcoming_in = forderungen
  .filter(f => f.status === 'open' && f.due_date <= today+30)
  .reduce((sum, f) => sum + f.amount, 0)

// Sorties prévues (30 jours)
upcoming_out = zahlungen
  .filter(z => z.status === 'pending' && z.due_date <= today+30)
  .reduce((sum, z) => sum + z.amount, 0)

// Projection
projected_balance = current_balance + upcoming_in - upcoming_out

// Alertes
if (projected_balance < 0) {
  alert('⚠️ Trésorerie négative projetée!')
}
```

### 5. Alertes contrats expirants

```javascript
contracts.forEach(c => {
  const daysUntilExpiry = daysBetween(today, c.endDate)

  if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
    c.status = 'expiring'
    notifications.push({
      type: 'warning',
      message: `Contrat "${c.name}" expire dans ${daysUntilExpiry} jours`
    })
  }

  if (daysUntilExpiry <= 0) {
    c.status = 'expired'
  }
})
```

### 6. Calcul KPIs Dashboard

```javascript
// KPI 1: Trésorerie totale
totalBalance = bankkonten.reduce((sum, b) => sum + b.balance, 0)

// KPI 2: Paiements en attente (montant total)
pendingPayments = zahlungen
  .filter(z => z.status === 'pending')
  .reduce((sum, z) => sum + z.amount, 0)

// KPI 3: Créances ouvertes (montant total)
openInvoices = forderungen
  .filter(f => f.status === 'open')
  .reduce((sum, f) => sum + f.amount, 0)

// KPI 4: Coûts du mois en cours
const currentMonth = new Date().getMonth()
monthCosts = kosten
  .filter(k => new Date(k.date).getMonth() === currentMonth)
  .reduce((sum, k) => sum + k.amount, 0)

// KPI 5: Taux de recouvrement
totalInvoiced = forderungen.reduce((sum, f) => sum + f.amount, 0)
totalPaid = forderungen
  .filter(f => f.status === 'paid')
  .reduce((sum, f) => sum + f.amount, 0)
recoveryRate = (totalPaid / totalInvoiced) * 100

// KPI 6: Délai moyen de paiement
avgPaymentDelay = forderungen
  .filter(f => f.status === 'paid')
  .map(f => daysBetween(f.invoice_date, f.paid_date))
  .reduce((sum, days) => sum + days, 0) / paidCount
```

---

## 🎨 FEATURES PRINCIPALES

### 1. Performance instantanée

**DataPreloader**:
```javascript
// Au chargement de l'app
DataPreloader.preloadAll([
  'bankkonten',
  'zahlungen',
  'forderungen',
  'kosten',
  'contracts',
  'entitaeten'
])

// Résultat: affichage < 50ms
```

**View caching**:
- HTML des pages en cache (Map)
- Pas de re-fetch si déjà chargé
- Navigation instantanée

### 2. Affichage unifié (Tables)

**Toutes les listes de données**: TABLE standardisée

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Colonne 1</th>
      <th>Colonne 2</th>
      <th>Montant</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- Lignes de données -->
    <tr>
      <td>Data</td>
      <td class="amount">CHF 1,500.00</td>
      <td><span class="status-badge pending">pending</span></td>
      <td class="actions">
        <button class="btn btn-secondary">Bearbeiten</button>
      </td>
    </tr>
  </tbody>
</table>
```

**Badges de statut**:
- `.status-badge.pending` → Jaune (en attente)
- `.status-badge.completed` / `.paid` → Vert (terminé)
- `.status-badge.failed` / `.overdue` → Rouge (échec/retard)

### 3. Modals génériques

**Pattern réutilisable**:
```javascript
createGenericModal({
  id: 'paymentModal',
  title: 'Zahlung bearbeiten',
  idFieldName: 'paymentId',
  maxWidth: '600px',
  fields: [
    { id: 'paymentSupplier', label: 'Empfänger', type: 'text', required: true },
    { id: 'paymentAmount', label: 'Betrag', type: 'number', required: true },
    { id: 'paymentCategory', label: 'Kategorie', type: 'select', options: [...] },
    { id: 'paymentDueDate', label: 'Fälligkeitsdatum', type: 'date' }
  ],
  onSubmit: 'savePayment',
  onClose: 'closePaymentModal'
})
```

Génère automatiquement:
- HTML du modal
- Styling cohérent
- Form validation
- Submit/cancel handlers

### 4. Helpers génériques

**loadDataWithCache()**:
```javascript
// Remplace 16 lignes de code dupliqué par 1 ligne
currentPayments = await loadDataWithCache('zahlungen', displayPayments, 'zahlungen')
```

**closeGenericModal()**:
```javascript
// Remplace 8 lignes de code par 1 ligne
closeGenericModal('paymentModal', 'paymentId')
```

### 5. Multi-entités

**Use case**: Entreprise avec plusieurs sociétés

```
KontiQ Holding AG
  ├─ KontiQ GmbH (Suisse)
  ├─ KontiQ France SARL
  └─ KontiQ Services Ltd

Manager de "KontiQ GmbH":
  - Voit uniquement les comptes/paiements de KontiQ GmbH
  - Peut inviter des employés pour KontiQ GmbH
  - Ne voit PAS KontiQ France
```

### 6. Reporting & Export

**Filtres disponibles**:
- Période (date range)
- Entité
- Catégorie
- Status

**Exports**:
- PDF (via API /export/pdf)
- Excel (via API /export/excel)

**Types de rapports**:
- Dépenses par catégorie
- Revenus par catégorie
- Évolution trésorerie
- Créances aging (par ancienneté)
- Contrats actifs/expirants

---

## 📐 RÈGLES DE DESIGN

### Couleurs

```css
--navy: #0A2540       /* Bleu marine Kontiq */
--teal: #0EB17A       /* Vert teal Kontiq */
--warning: #F59E0B    /* Orange alertes */
--error: #DC2626      /* Rouge erreurs */
--success: #0EB17A    /* Vert succès */
```

### Typography

- Police: Inter (fallback: system fonts)
- Montants: SF Mono (monospace pour alignement)

### Patterns visuels

- Cards: border-radius 8px, shadow-sm
- Buttons: border-radius 8px
- Tables: hover effect sur lignes
- Modals: overlay 50% opacité

---

## 🚀 PROCHAINES ÉVOLUTIONS (non implémentées)

1. **Récurrence automatique contrats** → génère zahlungen
2. **Notifications push** pour alertes
3. **Intégration bancaire réelle** (API bancaires)
4. **OCR factures** (upload PDF → extract data)
5. **Workflow d'approbation** (manager approuve paiements > 5000 CHF)
6. **Multi-devises** (EUR, USD en plus de CHF)
7. **Comptabilité double entrée** (bilan, compte de résultat)

---

## ✅ CHECKLIST IMPLÉMENTATION

Pour recréer Kontiq from scratch, il faut:

### Phase 1: Infrastructure
- [ ] Routing SPA (fragment-based)
- [ ] API client centralisé
- [ ] Cache système (DataPreloader)
- [ ] Session management (localStorage)
- [ ] Authentication (JWT)

### Phase 2: Données de base
- [ ] Users & auth
- [ ] Entitäten (multi-entités)
- [ ] Permissions RBAC
- [ ] Catégories (zahlungen & forderungen)

### Phase 3: Modules financiers
- [ ] Bankkonten (filtrage par entités)
- [ ] Zahlungen (avec catégories)
- [ ] Forderungen (avec catégories)
- [ ] Kosten
- [ ] Verträge

### Phase 4: Analytique
- [ ] Dashboard (KPIs)
- [ ] Liquidität (projection)
- [ ] KPIs (métriques avancées)
- [ ] Reports (exports PDF/Excel)

### Phase 5: UX/UI
- [ ] Design system (CSS variables)
- [ ] Composants génériques (modals, tables)
- [ ] Responsive mobile
- [ ] Loading states
- [ ] Error handling

### Phase 6: Features avancées
- [ ] Simulateur Skonto
- [ ] Alertes (créances retard, contrats expirants)
- [ ] Notifications
- [ ] Settings utilisateur

---

## 📝 NOTES IMPORTANTES

1. **Convention snake_case**: TOUS les champs JSON en snake_case (due_date, client_name, created_at)

2. **IDs uniques**: Préfixes par type (ZAH-001, FOR-001, BK-001, VER-001)

3. **Dates ISO**: Format "YYYY-MM-DD" ou ISO 8601 complet

4. **Montants**: Toujours en CHF, 2 décimales

5. **Status**: Limités à des valeurs prédéfinies (pending/completed/failed, open/paid/overdue, active/expiring/expired)

6. **Filtrage permissions**: TOUJOURS filtrer côté frontend ET backend

7. **Cache invalidation**: Invalider cache après CREATE/UPDATE/DELETE

8. **Error handling**: Toujours try/catch avec fallback et notification user

---

**FIN DE LA DOCUMENTATION**

*Version: 1.0 - Janvier 2026*
*Architecture Kontiq telle qu'implémentée et fonctionnelle*
