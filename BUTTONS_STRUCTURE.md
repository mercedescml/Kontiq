# KONTIQ - STRUCTURE COMPLÈTE DES BOUTONS

## 📱 PAGES ET LEURS BOUTONS

### 1. **LIQUIDITÄT (Liquidité)**
```
┌─────────────────────────────────────┐
│  Kredit vs Skonto  [BUTTON]         │  ← openCreditSimulator()
│  Export           [BUTTON]          │  ← exportPDF()
├─────────────────────────────────────┤
│ Actions:                            │
│  • Überweisung vorbereiten          │  ← prepareTransfer()
│  • Rechnung erstellen               │  ← createInvoice()
│  • Export wird vorbereitet          │  ← exportPDF()
│  • Kontoübersicht öffnen            │  ← openAccountOverview()
└─────────────────────────────────────┘

Modal: Credit Simulator
  Input: Kreditbetrag, Zinssatz, Laufzeit, Skontosatz
  Button: Berechnen ← calculateCreditSimulation()
  Output: Ergebnis comparatif
```

### 2. **VERTRÄGE (Contrats)**
```
┌─────────────────────────────────────┐
│  Upload Vertrag   [BUTTON]          │  ← openUploadModal()
├─────────────────────────────────────┤
│ Onglets:                            │
│  [Alle Verträge] [Aktiv] [Bald auslaufend] [Vergleichen]
│    ↓              ↓       ↓                  ↓
│    switchTab('all')/'active'/'expiring'/'compare'
├─────────────────────────────────────┤
│ Contrats (cartes):                  │
│  • Details    [BUTTON]              │  ← showContractDetails(id)
│  • Modifier   [BUTTON]              │  ← editContract()
│  • Fermer     [BUTTON]              │  ← closeDetailsModal()
└─────────────────────────────────────┘

Modal: Upload
  Input: Fichiers
  Events: Drag & drop, click to select
  Button: Télécharger ← handleFileUpload()
```

### 3. **ZAHLUNGEN (Paiements)**
```
┌─────────────────────────────────────┐
│ Tableau paiements:                  │
│  Date | Empfänger | Montant | État │
│  ──── | ───────── | ─────── | ──── │
│  ...  | ...       | ...     | ...  │
│                               
│  Bearbeiten [BUTTON] ← editPayment(id)
│  Löschen   [BUTTON] ← deletePayment(id)
├─────────────────────────────────────┤
│ Filtres:                            │
│  [Tous] [Pending] [Completed] [Failed]
│    ↓     ↓         ↓            ↓
│    filterPayments('all'/'pending'/'completed'/'failed')
└─────────────────────────────────────┘
```

### 4. **FORDERUNGEN (Créances)**
```
┌─────────────────────────────────────┐
│ Grille créances:                    │
│  ┌──────────────────────────────┐  │
│  │ Kunde: ...                   │  │
│  │ Montant: CHF ...             │  │
│  │ État: open/paid/overdue      │  │
│  │ [Bearbeiten] ← editForderung(id)
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│ Filtres par statut:                 │
│  [Tous] [Ouvert] [Payé] [Retard]   │
│    ↓     ↓        ↓      ↓         │
│    filterForderungen('all'/'open'/'paid'/'overdue')
└─────────────────────────────────────┘
```

### 5. **KOSTEN (Coûts)**
```
┌─────────────────────────────────────┐
│ Tableau coûts:                      │
│  Catégorie | Description | Montant │
│  ──────── | ─────────── | ─────── │
│  ...      | ...         | ...     │
│
│  [Supprimer] [BUTTON] ← deleteKosten(id)
├─────────────────────────────────────┤
│ Catégories:                         │
│  • Ajouter    [BUTTON] ← addCategory()
│  • Supprimer  [BUTTON] ← deleteCategory()
└─────────────────────────────────────┘
```

### 6. **KPIs**
```
┌─────────────────────────────────────┐
│ Cartes KPI:                         │
│  ┌──────────┐  ┌──────────┐        │
│  │ KPI 1    │  │ KPI 2    │        │
│  │ 12345.67 │  │ 9876.54  │        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│  [Actualiser] [BUTTON] ← refreshKPIs()
└─────────────────────────────────────┘
```

### 7. **REPORTS (Rapports)**
```
┌─────────────────────────────────────┐
│ Grille rapports:                    │
│  ┌──────────────────────────────┐  │
│  │ Rapport 1                    │  │
│  │ Période: 01.01 - 31.01      │  │
│  │ [PDF]  [Excel]              │  │
│  │ ← exportReport(idx, 'pdf/excel')
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Générer] [BUTTON] ← generateReport()
└─────────────────────────────────────┘
```

### 8. **BANKKONTEN (Comptes)**
```
┌─────────────────────────────────────┐
│ Cartes comptes:                     │
│  ┌──────────────────────────────┐  │
│  │ Nom: ...                     │  │
│  │ IBAN: ...                    │  │
│  │ Solde: CHF ...               │  │
│  │ [Bearbeiten] [Supprimer]    │  │
│  │  ↓           ↓              │  │
│  │  editBankkonto(id)         │  │
│  │  deleteBankkonto(id)       │  │
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Synchroniser] [BUTTON] ← syncBankAccounts()
└─────────────────────────────────────┘
```

### 9. **EINSTELLUNGEN (Paramètres)**
```
┌─────────────────────────────────────┐
│ Formulaire paramètres:              │
│  □ Nom entreprise:   [__________]  │
│  □ E-mail:           [__________]  │
│  □ Nouveau mot passe:[__________]  │
│  □ Confirmer:        [__________]  │
│  ☑ Notifications     [checkbox]    │
├─────────────────────────────────────┤
│  [Enregistrer] ← saveSettings()     │
│  [Réinitialiser mot passe]          │
│    ← resetPassword()                │
└─────────────────────────────────────┘
```

### 10. **ENTITÄTEN (Entités)**
```
┌─────────────────────────────────────┐
│ Cartes entités:                     │
│  ┌──────────────────────────────┐  │
│  │ Nom: ...                     │  │
│  │ Type: ...                    │  │
│  │ CHE-Nr: ...                  │  │
│  │ [Bearbeiten] [Supprimer]    │  │
│  │  ↓           ↓              │  │
│  │  editEntitaet(id)          │  │
│  │  deleteEntitaet(id)        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 11. **ABONNEMENT**
```
┌─────────────────────────────────────┐
│ Statut abonnement:                  │
│  Status: Active                     │
│  Plan: Professional                 │
│  Prix: CHF 99.00 / Mois             │
├─────────────────────────────────────┤
│ Tarifs:                             │
│  Starter       CHF 49/Mo            │
│  Professional  CHF 99/Mo            │
│  Enterprise    Sur demande          │
├─────────────────────────────────────┤
│  [Upgrader] ← upgradePlan()         │
│  [Mettre en pause] ← pauseAbonnement()
│  [Résilier] ← cancelAbonnement()    │
└─────────────────────────────────────┘
```

---

## 🔗 STRUCTURE API

### Client API (api-client.js)
```javascript
API.categories        // GET/POST/DELETE
API.users             // register(), login()
API.onboarding        // GET/POST
API.dashboard         // GET
API.zahlungen         // GET/POST/PUT/DELETE
API.contracts         // GET/POST/PUT/DELETE
API.bankkonten        // GET/POST/PUT/DELETE
API.kosten            // GET/POST/DELETE
API.forderungen       // GET/POST/PUT/DELETE
API.kpis              // GET
API.reports           // generate(), export()
API.export            // toPdf(), toExcel()
API.simulator         // calculateCredit()
API.entitaeten        // GET/POST/PUT/DELETE
API.abonnement        // getStatus(), update()
API.einstellungen     // get(), update()
```

### Serveur (server.js)
```
GET    /api/contracts
POST   /api/contracts
PUT    /api/contracts/:id
DELETE /api/contracts/:id

GET    /api/zahlungen
POST   /api/zahlungen
PUT    /api/zahlungen/:id
DELETE /api/zahlungen/:id

GET    /api/bankkonten
POST   /api/bankkonten
PUT    /api/bankkonten/:id
DELETE /api/bankkonten/:id

GET    /api/kosten
POST   /api/kosten
DELETE /api/kosten/:id

GET    /api/forderungen
POST   /api/forderungen

POST   /api/export/pdf
POST   /api/export/excel
POST   /api/credit-simulator
... (autres routes)
```

---

## 📊 RÉSUMÉ DES FONCTIONNALITÉS

| Page | Affichage | Création | Édition | Suppression | Filtrage |
|------|-----------|----------|---------|-------------|----------|
| Liquidité | ✅ | ✗ | ✗ | ✗ | ✗ |
| Contrats | ✅ | ✅ (upload) | ✅ | ✗ | ✅ (onglets) |
| Paiements | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créances | ✅ | ✅ | ✅ | ✗ | ✅ |
| Coûts | ✅ | ✅ | ✗ | ✅ | ✗ |
| KPIs | ✅ | ✗ | ✗ | ✗ | ✗ |
| Rapports | ✅ | ✅ | ✗ | ✗ | ✅ |
| Comptes | ✅ | ✅ | ✅ | ✅ | ✗ |
| Paramètres | ✅ | ✗ | ✅ | ✗ | ✗ |
| Entités | ✅ | ✅ | ✅ | ✅ | ✗ |
| Abonnement | ✅ | ✗ | ✅ | ✗ | ✗ |

---

## 🎯 POINTS CRITIQUES À VÉRIFIER

1. ✅ **api-client.js** - Tous les endpoints sont définis
2. ✅ **app.js** - Navigation et notifications fonctionnent
3. ⏳ **server.js** - Routes API doivent être ajoutées (voir API_ROUTES_TO_ADD.js)
4. ⏳ **HTML** - Scripts JS doivent être liés dans les pages
5. ⏳ **data/*.json** - Fichiers doivent exister

---

## 🚀 CHECKLIST FINALE

- [ ] Routes API ajoutées dans server.js
- [ ] Fichiers data/*.json créés
- [ ] Scripts JS liés dans chaque page HTML
- [ ] Serveur démarre sans erreur
- [ ] Page liquidité: boutons fonctionnent
- [ ] Page contrats: upload fonctionne
- [ ] Page paiements: affichage fonctionne
- [ ] Page comptes: CRUD fonctionne
- [ ] Console: aucune erreur JavaScript
- [ ] Notifications: apparaissent correctement

