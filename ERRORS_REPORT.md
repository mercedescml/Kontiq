# Rapport d'Erreurs et Incohérences - Kontiq

## 📋 Résumé Exécutif

Ce rapport identifie les erreurs critiques, doublons et incohérences dans le codebase Kontiq qui empêchent le bon fonctionnement de l'application.

---

## 🔴 ERREURS CRITIQUES

### 1. **zahlungen.js - Appel de fonction inexistante**
**Fichier**: `public/js/zahlungen.js:375`
```javascript
// ❌ ERREUR - La fonction loadPayments() n'existe pas!
document.addEventListener('DOMContentLoaded', () => {
  console.log('Zahlungen page loaded');
  loadPayments();  // <-- ERREUR: devrait être loadZahlungen()
});
```

**Impact**: La page Zahlungen ne charge JAMAIS les données au démarrage
**Solution**: Remplacer `loadPayments()` par `loadZahlungen()`

---

### 2. **Conteneurs manquants dans les fichiers HTML**
Les fichiers JavaScript cherchent des conteneurs qui n'existent PAS dans le HTML:

#### **forderungen.html**
```javascript
// forderungen.js:67-68
const container = document.querySelector('.forderungen-list') ||
                 document.querySelector('[data-forderungen-container]');
```
❌ **ERREUR**: Aucun élément `.forderungen-list` ou `[data-forderungen-container]` n'existe dans `forderungen.html`

#### **kosten.html**
```javascript
// kosten.js:69-70
const container = document.querySelector('.kosten-list') ||
                 document.querySelector('[data-kosten-container]');
```
❌ **ERREUR**: Aucun élément `.kosten-list` ou `[data-kosten-container]` n'existe dans `kosten.html`

#### **zahlungen.html**
```javascript
// zahlungen.js:105-106
const container = document.querySelector('.payments-list') ||
                 document.querySelector('[data-payments-container]');
```
❌ **ERREUR**: Aucun élément `.payments-list` ou `[data-payments-container]` n'existe dans `zahlungen.html`

#### **bankkonten.html**
```javascript
// bankkonten.js:135-136
const container = document.querySelector('.bankkonten-grid') ||
                 document.querySelector('[data-bankkonten-container]');
```
❌ **ERREUR**: Aucun élément `.bankkonten-grid` ou `[data-bankkonten-container]` n'existe dans `bankkonten.html`

**Impact**: Les données ne s'affichent jamais car les conteneurs sont introuvables
**Solution**: Ajouter les conteneurs dans chaque fichier HTML OU corriger les sélecteurs JS pour utiliser les conteneurs existants

---

### 3. **Fonction dupliquée - closeBankModal()**
**Fichier**: `public/js/bankkonten.js`

```javascript
// Ligne 277 - Première définition
function closeBankModal() {
  const modal = document.getElementById('bankModal');
  const overlay = document.getElementById('bankOverlay');
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// Ligne 361 - DOUBLON !!!
function closeBankModal() {
  const modal = document.getElementById('bankModal');
  if (modal) modal.style.display = 'none';
  const form = modal?.querySelector('form');
  if (form) form.reset();
  const idField = document.getElementById('accountId');
  if (idField) idField.value = '';
}
```

**Impact**: La deuxième définition écrase la première, comportement imprévisible
**Solution**: Fusionner les deux fonctions en une seule avec toute la logique nécessaire

---

## ⚠️ INCOHÉRENCES DE DONNÉES

### 4. **Noms de champs incohérents - Forderungen**

**Fichier JSON**: `data/forderungen.json`
```json
{
  "id": "FOR-001",
  "client_name": "Firma ABC GmbH",     // ← utilise client_name
  "invoice_date": "2025-11-15",        // ← utilise invoice_date
  "due_date": "2025-12-05",            // ← utilise due_date (snake_case)
  "kategorie": "CAT-001"               // ← utilise kategorie (allemand)
}
```

**Fichier JavaScript**: `public/js/forderungen.js:8-10`
```javascript
async function saveForderung(event) {
  const customer = document.getElementById('forderungCustomer').value.trim();  // ← cherche customer
  const dueDate = document.getElementById('forderungDueDate').value;           // ← utilise dueDate (camelCase)
  // ...
  const data = { customer, amount, dueDate, status };
}
```

❌ **INCOHÉRENCE**:
- JSON utilise `client_name`, JS utilise `customer`
- JSON utilise `due_date` (snake_case), JS utilise `dueDate` (camelCase)
- JSON utilise `kategorie`, pas de mapping dans le code

**Impact**: Les données ne se sauvegardent/chargent pas correctement
**Solution**: Standardiser TOUS les noms de champs (choisir snake_case OU camelCase)

---

### 5. **Champs dupliqués - Zahlungen**

**Fichier**: `data/zahlungen.json`
```json
{
  "id": "ZAH-001",
  "recipient": "Büromöbel Schmidt GmbH",    // ← DOUBLON
  "supplier": "Büromöbel Schmidt GmbH",     // ← DOUBLON (même valeur)
  "amount": 2500.00,
  "dueDate": "2026-01-20"                   // ← camelCase
}
```

**Fichier JavaScript**: `public/js/zahlungen.js:140,192`
```javascript
// Ligne 140 - utilise les DEUX champs de manière incohérente!
<td>${payment.recipient || payment.supplier || '-'}</td>

// Ligne 192 - pareil
if (recipientField) recipientField.value = payment.recipient || payment.supplier || '';
```

❌ **INCOHÉRENCE**: Duplication inutile de données, confusion sur quel champ utiliser
**Impact**: Code fragile, difficile à maintenir, risque de bugs
**Solution**: Choisir UN SEUL champ (soit recipient, soit supplier) et le standardiser partout

---

### 6. **Incohérence snake_case vs camelCase**

Les fichiers JSON mélangent les conventions de nommage:

| Module | Champ | Convention | Incohérence |
|--------|-------|-----------|-------------|
| zahlungen.json | `dueDate` | camelCase | ✓ Cohérent |
| zahlungen.json | `netto_betrag` | snake_case | ❌ Mélangé |
| zahlungen.json | `steuer_rate` | snake_case | ❌ Mélangé |
| forderungen.json | `client_name` | snake_case | ✓ Cohérent |
| forderungen.json | `due_date` | snake_case | ✓ Cohérent |
| forderungen.json | `invoice_date` | snake_case | ✓ Cohérent |
| factures.json | `supplier_name` | snake_case | ✓ Cohérent |
| factures.json | `due_date` | snake_case | ✓ Cohérent |

**Recommandation**: Utiliser **snake_case partout** (convention standard pour JSON/APIs)

---

## 🔧 DOUBLONS DE CODE

### 7. **Logique de modal dupliquée**

Chaque module réimplémente la même logique de création/fermeture de modal:

```javascript
// forderungen.js:135-175 (41 lignes)
function createForderungModal() { /* ... */ }

// kosten.js:149-185 (37 lignes)
function createKostenModal() { /* ... */ }

// zahlungen.js:214-283 (70 lignes)
function createPaymentModal() { /* ... */ }

// bankkonten.js:327-359 (33 lignes)
function createBankModal() { /* ... */ }
```

**Impact**: ~180 lignes de code dupliqué, maintenance difficile
**Solution**: Créer une fonction générique `createModal(config)` réutilisable

---

### 8. **Logique de chargement de données dupliquée**

Chaque module réimplémente la même logique de cache:

```javascript
// Pattern répété dans forderungen.js, kosten.js, zahlungen.js, bankkonten.js
async function loadXXX() {
  try {
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('xxx')) {
      data = DataPreloader.cache.get('xxx');
    } else {
      data = await API.xxx.getAll();
    }
    currentXXX = data.xxx || [];
    displayXXX(currentXXX);
  } catch (error) {
    APP.notify('Fehler beim Laden...', 'error');
  }
}
```

**Impact**: ~100+ lignes de code dupliqué
**Solution**: Créer une fonction générique `loadData(resource, displayFn)`

---

## 🎨 INCOHÉRENCES D'AFFICHAGE

### 9. **Styles inline vs classes CSS**

Les fonctions `displayXXX()` utilisent massivement des styles inline au lieu de classes CSS:

```javascript
// forderungen.js:87-94
html += `
  <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <h4 style="margin: 0 0 10px 0; color: #0A2540;">${f.customer || 'Kunde'}</h4>
    <p style="margin: 5px 0; color: #6B7280;"><strong>Betrag:</strong> CHF ${f.amount?.toFixed(2)}</p>
    // ...
  </div>
`;
```

**Impact**:
- HTML surchargé et illisible
- Impossible de maintenir un thème cohérent
- Duplication des valeurs de couleur/spacing partout

**Solution**: Créer des classes CSS réutilisables (`.card`, `.card-title`, `.amount`, etc.)

---

### 10. **Affichage table vs grid vs cards incohérent**

- **Forderungen**: Affiche en GRID de cards
- **Kosten**: Affiche en TABLE
- **Zahlungen**: Affiche en TABLE
- **Bankkonten**: Affiche en GRID de cards
- **Rechnungen**: Affiche en TABLE customisée

**Impact**: Expérience utilisateur incohérente
**Solution**: Standardiser sur UN format (recommandé: TABLE responsive)

---

## 🔍 API CLIENT - INCOHÉRENCES

### 11. **Pas d'endpoint pour factures dans api-client.js**

**Fichier**: `public/js/api-client.js`

Le module Rechnungen utilise `/api/factures` mais il n'y a PAS d'entrée dans l'objet API:

```javascript
// rechnungen.js:14 - Appel direct sans API client
const response = await fetch('/api/factures', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
```

Alors que tous les autres modules utilisent l'API client:
```javascript
// zahlungen.js:77
data = await API.zahlungen.getAll();

// forderungen.js:53
data = await API.forderungen.getAll();
```

❌ **INCOHÉRENCE**: Rechnungen ne suit pas le pattern établi
**Impact**: Pas de gestion centralisée des erreurs, pas de cache, code fragile
**Solution**: Ajouter `factures` à l'objet API dans api-client.js

---

## 📊 RÉCAPITULATIF DES PRIORITÉS

| Priorité | Erreur | Impact | Effort |
|----------|--------|--------|--------|
| 🔴 P0 | zahlungen.js loadPayments() inexistant | BLOQUANT | 1 min |
| 🔴 P0 | Conteneurs HTML manquants | BLOQUANT | 30 min |
| 🟠 P1 | Noms de champs incohérents | GRAVE | 2h |
| 🟠 P1 | Fonction closeBankModal() dupliquée | GRAVE | 5 min |
| 🟡 P2 | Champs dupliqués (recipient/supplier) | MOYEN | 1h |
| 🟡 P2 | Pas d'endpoint factures dans API | MOYEN | 10 min |
| 🔵 P3 | Code dupliqué (modals, loading) | BAS | 4h |
| 🔵 P3 | Styles inline vs CSS | BAS | 8h |
| 🔵 P3 | Affichage incohérent | BAS | 4h |

---

## ✅ RECOMMANDATIONS

1. **URGENT**: Corriger les 2 erreurs P0 (bloquantes)
2. **Court terme**: Standardiser les noms de champs (snake_case partout)
3. **Moyen terme**: Refactoriser le code dupliqué (modals, loading)
4. **Long terme**: Créer un design system avec composants réutilisables

---

**Généré le**: 2026-01-28
**Modules analysés**: forderungen, kosten, zahlungen, bankkonten, rechnungen
**Fichiers scannés**: 5 JS + 5 HTML + 3 JSON
