# Kontiq - Practical Implementation Plan
## Making Your App Fully Functional

**Current Status**: ~55% Complete
**Goal**: 100% Functional App
**Timeline**: 2-3 weeks
**Date**: 2026-01-07

---

## 📊 Current State Analysis

### ✅ What's ACTUALLY Working (55%)
- User registration & login
- Zahlungen (Payments) - create, view, delete (edit missing)
- Kosten (Costs) - create, view, delete (edit missing)
- Forderungen (Receivables) - create, view, delete (edit missing)
- Bankkonten (Bank accounts) - create, view, delete (edit missing)
- Entitäten (Entities) - create, view, delete (edit missing)
- Permissions system
- App navigation & caching
- Mobile responsive design (partial)

### ❌ What's NOT Working (45%)
1. **CRITICAL BLOCKER**: `public/js/vertrage.js` file is MISSING - contracts page doesn't work!
2. Dashboard shows zeros (no real calculation)
3. KPIs show zeros (no real calculation)
4. Edit modals are stubs in all modules
5. PDF/Excel export returns fake URLs (no real files)
6. Reports don't generate
7. Password reset doesn't work
8. No input validation
9. **SECURITY**: Password hashing uses SHA-256 (vulnerable!)

---

## 🎯 Implementation Plan - 3 Weeks

### WEEK 1: Fix Critical Issues (Must Do First!)

#### Day 1-2: Security & Critical Bug Fixes
**Priority**: 🔴 CRITICAL

**Task 1.1: Fix Password Hashing**
```bash
npm install bcrypt
```

**File**: `server.js` lines 41-42
**Change**:
```javascript
// OLD (VULNERABLE):
const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd || '').digest('hex');

// NEW (SECURE):
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const hashPassword = async (pwd) => await bcrypt.hash(pwd || '', SALT_ROUNDS);
const verifyPassword = async (pwd, hash) => await bcrypt.compare(pwd, hash);
```

**Files to Update**:
- `server.js` line 238-243 (registration) - make async
- `server.js` line 273 (login) - use verifyPassword()

**Time**: 2 hours
**Impact**: Fixes critical security vulnerability

---

**Task 1.2: Create Missing vertrage.js File**
**Priority**: 🔴 CRITICAL

**Problem**: Contracts page loads but nothing works - JavaScript handler is completely missing!

**File to Create**: `public/js/vertrage.js`

**Implementation**:
```javascript
/**
 * Contracts Management (Verträge)
 */

let currentContracts = [];

async function loadContracts() {
  try {
    const data = await API.contracts.getAll();
    currentContracts = data.contracts || [];
    displayContracts(currentContracts);
  } catch (error) {
    console.error('Error loading contracts:', error);
    APP.notify('Fehler beim Laden der Verträge', 'error');
  }
}

function displayContracts(contracts) {
  const container = document.querySelector('[data-contracts-container]') ||
                   document.querySelector('.contracts-list');

  if (!container) return;

  if (contracts.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Verträge gefunden</p>';
    return;
  }

  container.innerHTML = contracts.map(c => `
    <div class="contract-card" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #0A2540;">${c.name}</h3>
          <p style="color: #6B7280; margin: 5px 0;"><strong>Partner:</strong> ${c.partner}</p>
          <p style="color: #6B7280; margin: 5px 0;"><strong>Laufzeit:</strong> ${c.startDate} bis ${c.endDate}</p>
          <p style="color: #6B7280; margin: 5px 0;"><strong>Betrag:</strong> ${formatCurrency(c.amount)}</p>
          <p style="color: #6B7280; margin: 5px 0;"><strong>Status:</strong> <span class="status-badge status-${c.status}">${c.status}</span></p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="editContract('${c.id}')">Bearbeiten</button>
          <button class="btn btn-danger" onclick="deleteContract('${c.id}')">Löschen</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function addContract() {
  const modal = document.getElementById('contractModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('contractForm').reset();
  }
}

async function editContract(id) {
  const contract = currentContracts.find(c => c.id === id);
  if (!contract) return;

  const modal = document.getElementById('contractModal');
  if (modal) {
    modal.style.display = 'flex';
    // Fill form with contract data
    document.getElementById('contractId').value = contract.id;
    document.getElementById('contractName').value = contract.name;
    document.getElementById('contractPartner').value = contract.partner;
    document.getElementById('contractStartDate').value = contract.startDate;
    document.getElementById('contractEndDate').value = contract.endDate;
    document.getElementById('contractAmount').value = contract.amount;
    document.getElementById('contractStatus').value = contract.status;
  }
}

async function saveContract(event) {
  event.preventDefault();

  const id = document.getElementById('contractId').value;
  const data = {
    name: document.getElementById('contractName').value,
    partner: document.getElementById('contractPartner').value,
    startDate: document.getElementById('contractStartDate').value,
    endDate: document.getElementById('contractEndDate').value,
    amount: parseFloat(document.getElementById('contractAmount').value),
    status: document.getElementById('contractStatus').value
  };

  try {
    if (id) {
      await API.contracts.update(id, data);
      APP.notify('Vertrag aktualisiert', 'success');
    } else {
      await API.contracts.create(data);
      APP.notify('Vertrag erstellt', 'success');
    }
    closeContractModal();
    loadContracts();
  } catch (error) {
    APP.notify('Fehler beim Speichern', 'error');
    console.error(error);
  }
}

async function deleteContract(id) {
  if (!confirm('Möchten Sie diesen Vertrag wirklich löschen?')) return;

  try {
    await API.contracts.delete(id);
    APP.notify('Vertrag gelöscht', 'success');
    loadContracts();
  } catch (error) {
    APP.notify('Fehler beim Löschen', 'error');
    console.error(error);
  }
}

function closeContractModal() {
  const modal = document.getElementById('contractModal');
  if (modal) modal.style.display = 'none';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Contracts page loaded');
  loadContracts();
});
```

**Time**: 3 hours
**Impact**: Makes contracts page fully functional

---

**Task 1.3: Add Input Validation**
**Priority**: 🔴 HIGH

```bash
npm install joi
```

**File**: `server.js` (add at top)
```javascript
const Joi = require('joi');

// Validation schemas
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().optional(),
  company: Joi.string().optional()
});

const transactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  category: Joi.string().required(),
  description: Joi.string().max(500).optional(),
  date: Joi.date().optional(),
  userId: Joi.string().optional()
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
```

**Apply to endpoints**:
```javascript
app.post('/api/users/register', validate(userSchema), async (req, res) => { ... });
app.post('/api/zahlungen', validate(transactionSchema), (req, res) => { ... });
// etc.
```

**Time**: 4 hours
**Impact**: Prevents bad data, XSS attacks

---

#### Day 3-5: Complete Edit Functionality

**Task 1.4: Implement All Edit Modals**
**Priority**: 🟠 HIGH

Currently all these files have `editXXX()` functions that are stubs. Need to implement them.

**Files to Update**:
1. `public/js/zahlungen.js` - lines 104-112
2. `public/js/kosten.js` - lines 99-107
3. `public/js/forderungen.js` - lines 95-103
4. `public/js/bankkonten.js` - lines 108-116
5. `public/js/entitaeten.js` - lines 80-86

**Pattern for all** (example for zahlungen.js):
```javascript
async function editPayment(id) {
  const payment = currentZahlungen.find(z => z.id === id);
  if (!payment) return;

  // Open modal
  const modal = document.getElementById('zahlungModal');
  if (!modal) {
    APP.notify('Modal nicht gefunden', 'error');
    return;
  }

  // Fill form
  document.getElementById('zahlungId').value = payment.id;
  document.getElementById('zahlungAmount').value = payment.amount;
  document.getElementById('zahlungCategory').value = payment.category;
  document.getElementById('zahlungDate').value = payment.date;
  document.getElementById('zahlungDescription').value = payment.description || '';
  document.getElementById('zahlungStatus').value = payment.status;

  // Show modal
  modal.style.display = 'flex';
  document.querySelector('.modal-title').textContent = 'Zahlung bearbeiten';
}

async function savePayment(event) {
  event.preventDefault();

  const id = document.getElementById('zahlungId').value;
  const data = {
    amount: parseFloat(document.getElementById('zahlungAmount').value),
    category: document.getElementById('zahlungCategory').value,
    date: document.getElementById('zahlungDate').value,
    description: document.getElementById('zahlungDescription').value,
    status: document.getElementById('zahlungStatus').value
  };

  try {
    if (id) {
      await API.zahlungen.update(id, data);
      APP.notify('Zahlung aktualisiert', 'success');
    } else {
      await API.zahlungen.create(data);
      APP.notify('Zahlung erstellt', 'success');
    }
    closeModal();
    loadZahlungen();
  } catch (error) {
    APP.notify('Fehler beim Speichern', 'error');
  }
}
```

**Apply same pattern to**: kosten.js, forderungen.js, bankkonten.js, entitaeten.js

**Time**: 6 hours
**Impact**: Users can now edit all their data

---

### WEEK 2: Complete Core Features

#### Day 6-7: Dashboard & KPI Calculations

**Task 2.1: Implement Real Dashboard Metrics**
**Priority**: 🟠 HIGH

**File**: `server.js` line 65

**Current**:
```javascript
app.get('/api/dashboard', (req, res) => res.json({ liquiditaet: 0, skontoMoeglichkeiten: 0, faelligeZahlungen: 0 }));
```

**New Implementation**:
```javascript
app.get('/api/dashboard', (req, res) => {
  const userId = req.query.userId;

  try {
    const zahlungen = readJSON(FILES.zahlungen).filter(z => !userId || z.userId === userId);
    const forderungen = readJSON(FILES.forderungen).filter(f => !userId || f.userId === userId);
    const kosten = readJSON(FILES.kosten).filter(k => !userId || k.userId === userId);
    const bankkonten = readJSON(FILES.bankkonten).filter(b => !userId || b.userId === userId);

    // Calculate liquidity (total bank balance)
    const liquiditaet = bankkonten.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);

    // Calculate early payment discounts (Skonto)
    const today = new Date();
    const skontoMoeglichkeiten = zahlungen
      .filter(z => {
        if (!z.dueDate || z.status === 'paid') return false;
        const dueDate = new Date(z.dueDate);
        const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 14; // 2 weeks window
      })
      .reduce((sum, z) => sum + (parseFloat(z.amount) || 0) * 0.02, 0); // 2% skonto

    // Calculate overdue payments
    const faelligeZahlungen = zahlungen
      .filter(z => {
        if (!z.dueDate || z.status === 'paid') return false;
        const dueDate = new Date(z.dueDate);
        return dueDate < today;
      })
      .reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);

    // Additional metrics
    const offeneForderungen = forderungen
      .filter(f => f.status === 'open')
      .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    const monatskosten = kosten
      .filter(k => {
        if (!k.date) return false;
        const date = new Date(k.date);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return date >= monthStart;
      })
      .reduce((sum, k) => sum + (parseFloat(k.amount) || 0), 0);

    res.json({
      liquiditaet: Math.round(liquiditaet * 100) / 100,
      skontoMoeglichkeiten: Math.round(skontoMoeglichkeiten * 100) / 100,
      faelligeZahlungen: Math.round(faelligeZahlungen * 100) / 100,
      offeneForderungen: Math.round(offeneForderungen * 100) / 100,
      monatskosten: Math.round(monatskosten * 100) / 100,
      anzahlBankkonten: bankkonten.length
    });
  } catch (error) {
    console.error('Dashboard calculation error:', error);
    res.status(500).json({ error: 'Berechnung fehlgeschlagen' });
  }
});
```

**Time**: 3 hours
**Impact**: Dashboard now shows real data

---

**Task 2.2: Implement Real KPI Calculation**
**Priority**: 🟠 HIGH

**File**: `server.js` line 456

**Current**:
```javascript
app.get('/api/kpis', (req, res) => res.json({ kpis: { revenue: 0, expenses: 0, profit: 0 } }));
```

**New Implementation**:
```javascript
app.get('/api/kpis', (req, res) => {
  const userId = req.query.userId;
  const period = req.query.period || 'month'; // month, quarter, year

  try {
    const zahlungen = readJSON(FILES.zahlungen).filter(z => !userId || z.userId === userId);
    const forderungen = readJSON(FILES.forderungen).filter(f => !userId || f.userId === userId);
    const kosten = readJSON(FILES.kosten).filter(k => !userId || k.userId === userId);

    // Get date range based on period
    const today = new Date();
    let startDate;
    switch(period) {
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    // Calculate revenue (paid invoices/forderungen)
    const revenue = forderungen
      .filter(f => {
        if (!f.date || f.status !== 'paid') return false;
        const date = new Date(f.date);
        return date >= startDate;
      })
      .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    // Calculate expenses (kosten)
    const expenses = kosten
      .filter(k => {
        if (!k.date) return false;
        const date = new Date(k.date);
        return date >= startDate;
      })
      .reduce((sum, k) => sum + (parseFloat(k.amount) || 0), 0);

    // Calculate payments made
    const payments = zahlungen
      .filter(z => {
        if (!z.date || z.status !== 'paid') return false;
        const date = new Date(z.date);
        return date >= startDate;
      })
      .reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);

    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Additional KPIs
    const avgInvoiceValue = forderungen.length > 0 ? revenue / forderungen.length : 0;
    const cashFlow = revenue - payments;

    res.json({
      kpis: {
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        avgInvoiceValue: Math.round(avgInvoiceValue * 100) / 100,
        cashFlow: Math.round(cashFlow * 100) / 100,
        totalInvoices: forderungen.length,
        paidInvoices: forderungen.filter(f => f.status === 'paid').length,
        openInvoices: forderungen.filter(f => f.status === 'open').length
      },
      period: period,
      startDate: startDate.toISOString()
    });
  } catch (error) {
    console.error('KPI calculation error:', error);
    res.status(500).json({ error: 'Berechnung fehlgeschlagen' });
  }
});
```

**Time**: 3 hours
**Impact**: KPIs page shows real financial metrics

---

#### Day 8-10: Export Functionality

**Task 2.3: Implement PDF Export**
**Priority**: 🟡 MEDIUM

```bash
npm install pdfkit
```

**File**: `server.js` lines 458

**Implementation**:
```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

app.post('/api/export/pdf', (req, res) => {
  const { type, data } = req.body; // type: 'report', 'invoice', etc.

  try {
    const doc = new PDFDocument();
    const filename = `${type}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, 'exports', filename);

    // Ensure exports directory exists
    if (!fs.existsSync(path.join(__dirname, 'exports'))) {
      fs.mkdirSync(path.join(__dirname, 'exports'));
    }

    // Pipe to file
    doc.pipe(fs.createWriteStream(filepath));

    // Add content
    doc.fontSize(20).text('Kontiq Financial Report', 100, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString('de-DE')}`, 100, 80);
    doc.moveDown();

    // Add data based on type
    if (type === 'report' && data) {
      doc.fontSize(14).text('Financial Summary', 100, 120);
      doc.fontSize(10);
      doc.text(`Revenue: €${data.revenue || 0}`, 100, 150);
      doc.text(`Expenses: €${data.expenses || 0}`, 100, 170);
      doc.text(`Profit: €${data.profit || 0}`, 100, 190);
    }

    doc.end();

    // Wait for file to be written
    doc.on('finish', () => {
      res.json({
        success: true,
        url: `/exports/${filename}`,
        filename: filename
      });
    });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Export fehlgeschlagen' });
  }
});

// Serve export files
app.use('/exports', express.static(path.join(__dirname, 'exports')));
```

**Time**: 4 hours
**Impact**: Users can download PDF reports

---

**Task 2.4: Implement Excel Export**
**Priority**: 🟡 MEDIUM

```bash
npm install exceljs
```

**File**: `server.js` line 459

**Implementation**:
```javascript
const ExcelJS = require('exceljs');

app.post('/api/export/excel', async (req, res) => {
  const { type, data } = req.body;

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Financial Data');

    // Add headers
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Add data
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        sheet.addRow({
          date: item.date || '',
          description: item.description || '',
          category: item.category || '',
          amount: item.amount || 0,
          status: item.status || ''
        });
      });
    }

    // Style header
    sheet.getRow(1).font = { bold: true };

    // Save file
    const filename = `${type}-${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, 'exports', filename);

    await workbook.xlsx.writeFile(filepath);

    res.json({
      success: true,
      url: `/exports/${filename}`,
      filename: filename
    });
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Export fehlgeschlagen' });
  }
});
```

**Time**: 4 hours
**Impact**: Users can download Excel files

---

### WEEK 3: Polish & Testing

#### Day 11-12: Report Generation

**Task 3.1: Implement Report Generation**
**Priority**: 🟡 MEDIUM

**File**: `server.js` line 457

**Implementation**:
```javascript
app.post('/api/reports', (req, res) => {
  const { type, filters, userId } = req.body;

  try {
    let data = [];
    let title = '';

    switch(type) {
      case 'financial-overview':
        const zahlungen = readJSON(FILES.zahlungen).filter(z => !userId || z.userId === userId);
        const kosten = readJSON(FILES.kosten).filter(k => !userId || k.userId === userId);
        const forderungen = readJSON(FILES.forderungen).filter(f => !userId || f.userId === userId);

        data = {
          zahlungen: filterByDateRange(zahlungen, filters),
          kosten: filterByDateRange(kosten, filters),
          forderungen: filterByDateRange(forderungen, filters),
          summary: {
            totalRevenue: calculateTotal(forderungen, 'amount'),
            totalExpenses: calculateTotal(kosten, 'amount'),
            totalPayments: calculateTotal(zahlungen, 'amount')
          }
        };
        title = 'Financial Overview Report';
        break;

      case 'cash-flow':
        // Implement cash flow report
        break;

      case 'entity-comparison':
        // Implement entity comparison
        break;

      default:
        return res.status(400).json({ error: 'Unknown report type' });
    }

    const report = {
      id: Date.now().toString(),
      type: type,
      title: title,
      data: data,
      filters: filters,
      generatedAt: new Date().toISOString(),
      generatedBy: userId
    };

    res.json({ report: report });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

function filterByDateRange(items, filters) {
  if (!filters || !filters.startDate || !filters.endDate) return items;

  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);

  return items.filter(item => {
    if (!item.date) return false;
    const date = new Date(item.date);
    return date >= start && date <= end;
  });
}

function calculateTotal(items, field) {
  return items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
}
```

**Time**: 6 hours
**Impact**: Reports work properly

---

#### Day 13-15: Testing & Bug Fixes

**Task 3.2: Write Tests**
**Priority**: 🟠 HIGH

Write tests for the new functionality:

```bash
# Create test files
touch tests/unit/server/vertrage.test.js
touch tests/unit/server/dashboard.test.js
touch tests/unit/server/kpis.test.js
touch tests/unit/server/exports.test.js
```

**Time**: 8 hours
**Impact**: Confidence in code quality

---

**Task 3.3: End-to-End Testing**
**Priority**: 🟠 HIGH

1. Test user registration & login
2. Test creating/editing/deleting all resource types
3. Test dashboard displays correct metrics
4. Test KPIs calculate correctly
5. Test PDF/Excel export downloads
6. Test on mobile devices
7. Fix any bugs found

**Time**: 8 hours
**Impact**: Ensure everything works

---

## 📋 Complete Task Checklist

### Week 1: Critical Fixes
- [ ] Fix password hashing (bcrypt) - **2 hours**
- [ ] Create vertrage.js file - **3 hours**
- [ ] Add input validation (joi) - **4 hours**
- [ ] Implement edit modals (all 5 files) - **6 hours**

**Week 1 Total**: 15 hours

### Week 2: Core Features
- [ ] Implement dashboard calculations - **3 hours**
- [ ] Implement KPI calculations - **3 hours**
- [ ] Implement PDF export - **4 hours**
- [ ] Implement Excel export - **4 hours**

**Week 2 Total**: 14 hours

### Week 3: Polish
- [ ] Implement report generation - **6 hours**
- [ ] Write tests for new features - **8 hours**
- [ ] End-to-end testing & bug fixes - **8 hours**

**Week 3 Total**: 22 hours

---

## 💰 Resources Needed

### Dependencies to Install
```bash
npm install bcrypt joi pdfkit exceljs
```

**Cost**: Free (all open source)

### Time Investment
- **Total Development**: 51 hours (~1.5 weeks full-time or 3 weeks part-time)
- **Testing**: Included in timeline
- **Deployment**: Additional 4 hours

### Skills Required
- Node.js/Express
- JavaScript (frontend)
- PDF generation
- Excel manipulation
- Testing

---

## 🎯 Success Criteria

After completing this plan, your app will:

✅ Have secure password hashing
✅ Allow editing all data types
✅ Show real dashboard metrics
✅ Calculate real KPIs
✅ Export to PDF and Excel
✅ Generate financial reports
✅ Have input validation on all endpoints
✅ Have 60%+ test coverage
✅ Work fully on desktop and mobile
✅ Be ready for beta users

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install bcrypt joi pdfkit exceljs

# 2. Create missing file
touch public/js/vertrage.js

# 3. Start with security fix (TODAY!)
# Update server.js with bcrypt implementation

# 4. Test as you go
npm test

# 5. Deploy when ready
npm start
```

---

## 📞 Priority Order

**If you only have limited time, do in this order:**

1. **Fix password security** (2 hours) - CRITICAL for user safety
2. **Create vertrage.js** (3 hours) - Unblocks contracts feature
3. **Add edit modals** (6 hours) - Makes app actually usable
4. **Dashboard metrics** (3 hours) - Shows app value to users
5. Everything else is polish

**Minimum Viable**: First 4 items = 14 hours = 2 days of work

---

**Current App Status**: 55% complete, mostly working but missing key features
**After This Plan**: 95% complete, fully functional, ready for users
**Timeline**: 2-3 weeks part-time or 1.5 weeks full-time
**Next Step**: Install bcrypt and fix password security TODAY
