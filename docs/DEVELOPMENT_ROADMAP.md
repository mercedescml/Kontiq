# Kontiq App - Complete Development Roadmap
## Making Kontiq Production-Ready with Bill Upload, Entity Management, Mobile Support & Integrations

**Created**: 2026-01-07
**Target**: Production-ready financial management platform
**Platform**: Desktop & Mobile Web Application

---

## 📊 Current State Analysis

### ✅ What's Working
- Basic authentication (register/login)
- Entity management (CRUD operations)
- Permission system (Geschäftsführer/Employee roles)
- Multi-tenancy (company isolation)
- Basic CRUD for: Zahlungen, Kosten, Forderungen, Bankkonten, Contracts
- JSON file-based data storage
- Responsive UI framework (partial)

### ❌ What's Missing (Critical)
- **Bill/Document upload system** - NOT implemented
- **File storage infrastructure** - NOT implemented
- **Banking API integrations** - NOT implemented
- **Mobile optimization** - Partially implemented
- **Production database** - Using JSON files
- **Security hardening** - Password hashing vulnerable
- **Automated testing** - 0% coverage
- **OCR/Data extraction** - NOT implemented
- **Accounting software integration** - NOT implemented
- **Email notifications** - NOT implemented
- **CI/CD pipeline** - NOT implemented

---

## 🎯 Development Phases Overview

| Phase | Focus | Duration | Priority |
|-------|-------|----------|----------|
| **Phase 0** | Critical Security Fixes | 1 week | 🔴 CRITICAL |
| **Phase 1** | Bill Upload & Document Management | 2-3 weeks | 🔴 HIGH |
| **Phase 2** | Database Migration & Scalability | 2 weeks | 🔴 HIGH |
| **Phase 3** | Mobile Optimization | 2 weeks | 🟠 HIGH |
| **Phase 4** | Banking Integrations | 3-4 weeks | 🟠 HIGH |
| **Phase 5** | Accounting Software Integrations | 2-3 weeks | 🟡 MEDIUM |
| **Phase 6** | Enhanced Entity Management | 2 weeks | 🟡 MEDIUM |
| **Phase 7** | Testing & Quality Assurance | 3 weeks | 🔴 HIGH |
| **Phase 8** | Production Deployment | 1 week | 🔴 HIGH |

**Total Estimated Time**: 18-22 weeks (~4-5 months)

---

## Phase 0: Critical Security Fixes (Week 1)
### 🚨 MUST BE DONE FIRST

#### Task 0.1: Fix Password Hashing Vulnerability
**Priority**: 🔴 CRITICAL
**File**: `server.js:41`

**Current Issue**: Using SHA-256 (vulnerable to rainbow table attacks)

**Tasks**:
- [ ] Install bcrypt: `npm install bcrypt`
- [ ] Replace `hashPassword()` function with bcrypt
- [ ] Update registration endpoint to use async bcrypt.hash()
- [ ] Update login endpoint to use bcrypt.compare()
- [ ] Migrate existing passwords (create migration script)
- [ ] Test password login/registration

**Code Changes Needed**:
```javascript
// server.js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const hashPassword = async (pwd) => {
  return await bcrypt.hash(pwd || '', SALT_ROUNDS);
};

const verifyPassword = async (pwd, hash) => {
  return await bcrypt.compare(pwd, hash);
};
```

#### Task 0.2: Add Input Validation & Sanitization
**Priority**: 🔴 CRITICAL

**Tasks**:
- [ ] Install validator libraries: `npm install joi express-validator`
- [ ] Create validation middleware for all endpoints
- [ ] Sanitize user inputs (XSS protection)
- [ ] Add email format validation
- [ ] Add max length limits on all text fields
- [ ] Test with malicious inputs

#### Task 0.3: Add Rate Limiting
**Priority**: 🔴 HIGH

**Tasks**:
- [ ] Install: `npm install express-rate-limit`
- [ ] Add rate limiting to login endpoint (5 attempts/15min)
- [ ] Add rate limiting to registration (3 registrations/hour)
- [ ] Add global API rate limit (100 requests/15min)
- [ ] Test rate limiting

#### Task 0.4: Add CORS & Security Headers
**Priority**: 🟠 HIGH

**Tasks**:
- [ ] Install: `npm install helmet`
- [ ] Configure proper CORS origins
- [ ] Add security headers (helmet)
- [ ] Add CSRF protection: `npm install csurf`
- [ ] Test security headers

---

## Phase 1: Bill Upload & Document Management (Weeks 2-4)

### Task 1.1: File Upload Infrastructure
**Priority**: 🔴 HIGH
**Estimated Time**: 3 days

**Technology Stack**:
- **Backend**: multer (file upload middleware)
- **Storage**: Local storage initially, then AWS S3/MinIO
- **File Types**: PDF, PNG, JPG, JPEG, XLSX
- **Max Size**: 10MB per file

**Tasks**:
- [ ] Install dependencies:
  ```bash
  npm install multer sharp pdf-parse
  ```
- [ ] Create `/uploads` directory structure:
  ```
  uploads/
    ├── bills/
    ├── contracts/
    ├── invoices/
    └── temp/
  ```
- [ ] Create upload middleware (`middleware/upload.js`)
- [ ] Add file type validation
- [ ] Add virus scanning (optional): `npm install clamscan`
- [ ] Create cleanup job for orphaned files
- [ ] Add to `.gitignore`: `uploads/`

**API Endpoints to Create**:
```javascript
POST /api/uploads/bill
POST /api/uploads/contract
POST /api/uploads/invoice
GET /api/uploads/:id
DELETE /api/uploads/:id
```

**File**: `server.js` additions
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/bills/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only images, PDFs, and Excel files allowed!');
    }
  }
});

// Upload endpoint
app.post('/api/uploads/bill', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileData = {
    id: Date.now().toString(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedBy: req.body.userId,
    entityId: req.body.entityId,
    category: req.body.category || 'bill',
    uploadedAt: new Date().toISOString()
  };

  // Save metadata to files
  const uploads = readJSON(FILES.uploads);
  uploads.push(fileData);
  writeJSON(FILES.uploads, uploads);

  res.json({ file: fileData });
});
```

### Task 1.2: Bill Management UI
**Priority**: 🔴 HIGH
**Estimated Time**: 4 days

**Tasks**:
- [ ] Create new page: `public/views/bills.html`
- [ ] Create JavaScript: `public/js/bills.js`
- [ ] Design bill upload modal
- [ ] Add drag-and-drop file upload
- [ ] Add file preview (PDF viewer, image preview)
- [ ] Add bill list view (table/grid)
- [ ] Add filters (date, entity, category, status)
- [ ] Add bulk upload (multiple files)
- [ ] Add download functionality
- [ ] Add delete functionality
- [ ] Mobile-responsive design

**UI Components**:
```html
<!-- bills.html -->
<div class="bills-container">
  <div class="upload-zone" id="dropZone">
    <input type="file" id="fileInput" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx" />
    <div class="upload-prompt">
      <svg>📄</svg>
      <h3>Rechnung hochladen</h3>
      <p>Drag & Drop oder klicken Sie hier</p>
      <p class="file-types">PDF, JPG, PNG, XLSX (max 10MB)</p>
    </div>
  </div>

  <div class="bills-list">
    <div class="bill-filters">
      <select id="entityFilter">
        <option value="">Alle Entitäten</option>
      </select>
      <select id="categoryFilter">
        <option value="">Alle Kategorien</option>
        <option value="bill">Rechnung</option>
        <option value="invoice">Eingangsrechnung</option>
        <option value="receipt">Quittung</option>
      </select>
      <input type="date" id="dateFrom" />
      <input type="date" id="dateTo" />
    </div>

    <table class="bills-table" id="billsTable"></table>
  </div>
</div>
```

### Task 1.3: OCR & Data Extraction (Optional but Recommended)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 5 days

**Technology Options**:
1. **Google Cloud Vision API** (Recommended)
2. **Tesseract.js** (Free, client-side)
3. **AWS Textract** (Powerful but expensive)
4. **Mindee** (Specialized for invoices)

**Tasks**:
- [ ] Choose OCR provider
- [ ] Install SDK: `npm install @google-cloud/vision` (for Google)
- [ ] Set up API credentials
- [ ] Create OCR processing function
- [ ] Extract key fields:
  - Invoice number
  - Date
  - Total amount
  - Vendor name
  - Tax amount
  - Line items
- [ ] Create pre-filled form with extracted data
- [ ] Allow manual correction of OCR results
- [ ] Test with various invoice formats

**Implementation Example** (Google Cloud Vision):
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function extractInvoiceData(filePath) {
  const [result] = await client.documentTextDetection(filePath);
  const fullText = result.fullTextAnnotation.text;

  // Parse text to extract fields
  const invoiceData = {
    number: extractInvoiceNumber(fullText),
    date: extractDate(fullText),
    amount: extractAmount(fullText),
    vendor: extractVendor(fullText)
  };

  return invoiceData;
}

app.post('/api/uploads/extract', async (req, res) => {
  const { fileId } = req.body;
  const file = readJSON(FILES.uploads).find(f => f.id === fileId);

  if (!file) return res.status(404).json({ error: 'File not found' });

  try {
    const extractedData = await extractInvoiceData(file.path);
    res.json({ data: extractedData });
  } catch (error) {
    res.status(500).json({ error: 'Extraction failed' });
  }
});
```

### Task 1.4: Link Bills to Entities & Transactions
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Add `attachments` field to kosten/forderungen/zahlungen
- [ ] Create bill → transaction linking UI
- [ ] Show attached bills in transaction details
- [ ] Allow attaching multiple bills to one transaction
- [ ] Allow detaching bills
- [ ] Update API endpoints to include attachment IDs

**Data Structure**:
```javascript
// kosten.json example
{
  "id": "cost-123",
  "amount": 1500,
  "category": "Miete",
  "attachments": ["file-456", "file-789"],
  "entityId": "entity-1",
  ...
}
```

---

## Phase 2: Database Migration (Weeks 5-6)

### Task 2.1: Choose Database
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day

**Options**:
1. **PostgreSQL** (Recommended for financial data)
   - Strong ACID compliance
   - JSON support
   - Mature ecosystem

2. **MongoDB**
   - Flexible schema
   - Good for rapid development
   - Less strict consistency

3. **MySQL**
   - Widely supported
   - Good performance
   - Strong community

**Recommendation**: **PostgreSQL** for financial data integrity

### Task 2.2: Design Database Schema
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days

**Tables to Create**:
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entities table
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  category VARCHAR(50), -- 'abteilung' or 'standort'
  manager_id UUID REFERENCES users(id),
  company VARCHAR(255),
  address TEXT,
  tax_id VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'EUR',
  fiscal_year VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity_id UUID REFERENCES entities(id),
  role VARCHAR(50), -- 'geschaeftsfuehrer', 'manager', 'employee'
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploads/Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  category VARCHAR(50), -- 'bill', 'contract', 'invoice'
  uploaded_by UUID REFERENCES users(id),
  entity_id UUID REFERENCES entities(id),
  extracted_data JSONB, -- OCR results
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (kosten, zahlungen, forderungen)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50), -- 'kosten', 'zahlung', 'forderung'
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  category VARCHAR(100),
  description TEXT,
  transaction_date DATE,
  entity_id UUID REFERENCES entities(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction attachments (junction table)
CREATE TABLE transaction_attachments (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, file_id)
);

-- Bank accounts table
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id),
  bank_name VARCHAR(255),
  account_number VARCHAR(100),
  iban VARCHAR(34),
  bic VARCHAR(11),
  balance DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT TRUE,
  integration_id VARCHAR(255), -- For banking API
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank transactions (synced from bank)
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES bank_accounts(id),
  external_id VARCHAR(255), -- Bank's transaction ID
  amount DECIMAL(15, 2),
  currency VARCHAR(3),
  description TEXT,
  transaction_date DATE,
  value_date DATE,
  balance_after DECIMAL(15, 2),
  category VARCHAR(100),
  is_reconciled BOOLEAN DEFAULT FALSE,
  linked_transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  partner VARCHAR(255),
  entity_id UUID REFERENCES entities(id),
  start_date DATE,
  end_date DATE,
  amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(50),
  renewal_type VARCHAR(50),
  notice_period_days INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_entities_manager ON entities(manager_id);
CREATE INDEX idx_entities_company ON entities(company);
CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_entity ON permissions(entity_id);
CREATE INDEX idx_transactions_entity ON transactions(entity_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_files_entity ON files(entity_id);
```

### Task 2.3: Implement Database Layer (ORM)
**Priority**: 🔴 HIGH
**Estimated Time**: 3 days

**Options**:
1. **Prisma** (Recommended) - Modern, type-safe
2. **Sequelize** - Mature, feature-rich
3. **TypeORM** - If using TypeScript
4. **Knex.js** - Query builder

**Tasks**:
- [ ] Install Prisma: `npm install @prisma/client prisma`
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Define Prisma schema (`prisma/schema.prisma`)
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Create database: `npx prisma db push`
- [ ] Create migration scripts
- [ ] Update all API endpoints to use Prisma
- [ ] Test database operations

**Prisma Schema Example**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String?
  company       String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  entities      Entity[]
  permissions   Permission[]
  files         File[]
  transactions  Transaction[]

  @@map("users")
}

model Entity {
  id          String   @id @default(uuid())
  name        String
  type        String?
  category    String?
  managerId   String   @map("manager_id")
  company     String?
  address     String?
  taxId       String?  @map("tax_id")
  currency    String   @default("EUR")
  fiscalYear  String?  @map("fiscal_year")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  manager     User     @relation(fields: [managerId], references: [id])
  permissions Permission[]
  files       File[]
  transactions Transaction[]
  bankAccounts BankAccount[]
  contracts   Contract[]

  @@index([managerId])
  @@index([company])
  @@map("entities")
}

// ... more models
```

### Task 2.4: Data Migration from JSON to Database
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Create migration script: `scripts/migrate-to-db.js`
- [ ] Read all JSON files
- [ ] Transform data to match database schema
- [ ] Insert data into PostgreSQL
- [ ] Verify data integrity
- [ ] Backup JSON files
- [ ] Test application with new database
- [ ] Update `.gitignore` to keep data/ as backup

---

## Phase 3: Mobile Optimization (Weeks 7-8)

### Task 3.1: Responsive Design Audit
**Priority**: 🟠 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Test all pages on mobile devices
- [ ] Test on tablets
- [ ] Test on different screen sizes (320px, 375px, 768px, 1024px)
- [ ] Document issues:
  - Overflow problems
  - Unreadable text
  - Buttons too small
  - Tables not scrollable
  - Modals cut off
- [ ] Create mobile design mockups

### Task 3.2: Implement Mobile-First CSS
**Priority**: 🟠 HIGH
**Estimated Time**: 4 days

**Tasks**:
- [ ] Rewrite CSS with mobile-first approach
- [ ] Use CSS Grid and Flexbox
- [ ] Implement responsive breakpoints:
  ```css
  /* Mobile first */
  .container { width: 100%; }

  /* Tablet */
  @media (min-width: 768px) { ... }

  /* Desktop */
  @media (min-width: 1024px) { ... }
  ```
- [ ] Make tables responsive (card view on mobile)
- [ ] Increase touch targets (min 44px)
- [ ] Add hamburger menu for mobile
- [ ] Test on real devices

### Task 3.3: Mobile Navigation
**Priority**: 🟠 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Create mobile navigation component
- [ ] Add hamburger menu icon
- [ ] Implement slide-in menu
- [ ] Add bottom navigation bar (mobile)
- [ ] Add swipe gestures
- [ ] Test navigation on mobile

### Task 3.4: Progressive Web App (PWA)
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days

**Tasks**:
- [ ] Create `manifest.json`
- [ ] Add service worker for offline support
- [ ] Add app icons (multiple sizes)
- [ ] Add splash screens
- [ ] Test "Add to Home Screen" functionality
- [ ] Implement offline mode

**manifest.json**:
```json
{
  "name": "Kontiq - Financial Management",
  "short_name": "Kontiq",
  "description": "Financial transparency for SMEs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0A2540",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Phase 4: Banking Integrations (Weeks 9-12)

### Task 4.1: Research Banking APIs
**Priority**: 🟠 HIGH
**Estimated Time**: 2 days

**Options for European Banks (Germany/Switzerland/Austria)**:

1. **FinAPI** (Recommended) ⭐
   - Website: https://www.finapi.io/
   - Coverage: 4000+ German/European banks
   - Features: Account aggregation, transaction sync, payment initiation
   - Pricing: Pay-per-transaction
   - PSD2 compliant

2. **Tink**
   - Website: https://tink.com/
   - Coverage: 3400+ European banks
   - Features: Account aggregation, payment initiation, income verification
   - Owned by Visa

3. **Plaid** (US-focused but expanding to Europe)
   - Website: https://plaid.com/
   - Coverage: Growing European coverage
   - Strong in US

4. **Open Banking APIs (PSD2)**
   - Direct integration with banks
   - Requires individual bank agreements
   - More complex but no middleman

5. **Salt Edge**
   - Website: https://www.saltedge.com/
   - Coverage: 5000+ banks worldwide
   - Features: Account aggregation, payment initiation

**Recommendation**: **FinAPI** for German market

### Task 4.2: Set Up Banking API Account
**Priority**: 🟠 HIGH
**Estimated Time**: 1 day

**Tasks**:
- [ ] Sign up for FinAPI developer account
- [ ] Complete verification process
- [ ] Obtain API credentials (Client ID, Secret)
- [ ] Read API documentation
- [ ] Test in sandbox environment
- [ ] Understand rate limits and pricing

### Task 4.3: Implement Bank Account Connection
**Priority**: 🟠 HIGH
**Estimated Time**: 4 days

**Tasks**:
- [ ] Install SDK: `npm install finapi-client` (or use REST API)
- [ ] Create bank connection UI
- [ ] Implement OAuth flow for bank authentication
- [ ] Store bank connection credentials securely (encrypted)
- [ ] Handle multi-factor authentication (MFA)
- [ ] List user's bank accounts
- [ ] Save bank accounts to database
- [ ] Test with sandbox banks

**Implementation Flow**:
```javascript
// server.js
const FinAPI = require('finapi-client');

const finapi = new FinAPI({
  clientId: process.env.FINAPI_CLIENT_ID,
  clientSecret: process.env.FINAPI_CLIENT_SECRET,
  environment: 'sandbox' // or 'production'
});

app.post('/api/banking/connect', async (req, res) => {
  const { userId, bankId } = req.body;

  try {
    // 1. Create web form for user to enter credentials
    const webForm = await finapi.webForms.createImportBankConnection({
      bankId: bankId,
      redirectUrl: 'https://your-app.com/banking/callback'
    });

    // 2. Return web form URL to frontend
    res.json({
      webFormUrl: webForm.url,
      webFormId: webForm.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/banking/callback', async (req, res) => {
  const { webFormId } = req.body;

  try {
    // 3. Check if connection was successful
    const webForm = await finapi.webForms.get(webFormId);

    if (webForm.status === 'COMPLETED') {
      // 4. Get bank accounts
      const accounts = await finapi.accounts.getAll();

      // 5. Save to database
      for (const account of accounts) {
        await prisma.bankAccount.create({
          data: {
            entityId: req.body.entityId,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            iban: account.iban,
            balance: account.balance,
            integrationId: account.id
          }
        });
      }

      res.json({ success: true, accounts });
    } else {
      res.status(400).json({ error: 'Connection failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**UI Component** (`public/js/banking.js`):
```javascript
async function connectBank() {
  try {
    // 1. Show bank selection modal
    const bankId = await showBankSelectionModal();

    // 2. Request web form URL
    const res = await fetch('/api/banking/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankId, userId: currentUser.id })
    });

    const { webFormUrl } = await res.json();

    // 3. Open web form in popup or iframe
    window.open(webFormUrl, 'BankConnection', 'width=600,height=800');

    // 4. Listen for callback
    window.addEventListener('message', (event) => {
      if (event.data.type === 'bank-connected') {
        loadBankAccounts();
      }
    });
  } catch (error) {
    console.error('Bank connection failed:', error);
  }
}
```

### Task 4.4: Transaction Synchronization
**Priority**: 🟠 HIGH
**Estimated Time**: 3 days

**Tasks**:
- [ ] Implement automatic transaction sync
- [ ] Fetch new transactions daily (cron job)
- [ ] Store transactions in `bank_transactions` table
- [ ] Handle transaction categorization
- [ ] Detect duplicate transactions
- [ ] Show sync status in UI
- [ ] Allow manual sync trigger

**Cron Job** (using node-cron):
```javascript
const cron = require('node-cron');

// Sync transactions every day at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Starting daily transaction sync...');

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true }
  });

  for (const account of bankAccounts) {
    try {
      const transactions = await finapi.transactions.getAll({
        accountIds: [account.integrationId],
        minDate: account.lastSyncedAt || '2024-01-01'
      });

      for (const txn of transactions) {
        await prisma.bankTransaction.upsert({
          where: { externalId: txn.id },
          update: {},
          create: {
            bankAccountId: account.id,
            externalId: txn.id,
            amount: txn.amount,
            currency: txn.currency,
            description: txn.purpose,
            transactionDate: new Date(txn.valueDate),
            balanceAfter: txn.newBalance
          }
        });
      }

      await prisma.bankAccount.update({
        where: { id: account.id },
        data: { lastSyncedAt: new Date() }
      });
    } catch (error) {
      console.error(`Sync failed for account ${account.id}:`, error);
    }
  }

  console.log('Transaction sync completed');
});
```

### Task 4.5: Transaction Reconciliation
**Priority**: 🟡 MEDIUM
**Estimated Time**: 3 days

**Tasks**:
- [ ] Create reconciliation UI
- [ ] Show unreconciled bank transactions
- [ ] Allow linking bank transaction to manual transaction
- [ ] Suggest matches based on amount and date
- [ ] Mark as reconciled
- [ ] Show reconciliation status

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│ Unreconciled Transactions (15)                          │
├─────────────────────────────────────────────────────────┤
│ Bank Transaction         | Suggested Match              │
├─────────────────────────────────────────────────────────┤
│ -€1,500.00               | Miete Büro (€1,500.00)      │
│ Office Rent GmbH         | 📅 2024-03-01                │
│ 2024-03-02               | [Link] [Ignore]              │
├─────────────────────────────────────────────────────────┤
│ -€450.00                 | No match found              │
│ AWS Services             | [Create Transaction]         │
│ 2024-03-05               |                              │
└─────────────────────────────────────────────────────────┘
```

### Task 4.6: Payment Initiation (Optional)
**Priority**: 🟢 LOW
**Estimated Time**: 3 days

**Tasks**:
- [ ] Implement payment initiation via banking API
- [ ] Create payment form
- [ ] Request user authorization (Strong Customer Authentication)
- [ ] Execute payment
- [ ] Track payment status
- [ ] Show confirmation

---

## Phase 5: Accounting Software Integrations (Weeks 13-15)

### Task 5.1: Research Accounting Software APIs
**Priority**: 🟡 MEDIUM
**Estimated Time**: 1 day

**Popular Accounting Software in DACH Region**:

1. **DATEV** ⭐
   - Market leader in Germany
   - API: DATEV Connect
   - Website: https://developer.datev.de/

2. **Lexoffice**
   - Cloud-based
   - Good API documentation
   - Website: https://developers.lexoffice.io/

3. **sevDesk**
   - Popular among SMEs
   - REST API
   - Website: https://api.sevdesk.de/

4. **Sage**
   - International presence
   - API available

5. **BuchhaltungsButler**
   - German cloud accounting
   - API available

**Recommendation**: Start with **Lexoffice** (easiest API) and **DATEV** (market leader)

### Task 5.2: Lexoffice Integration
**Priority**: 🟡 MEDIUM
**Estimated Time**: 4 days

**Tasks**:
- [ ] Sign up for Lexoffice developer account
- [ ] Obtain API key
- [ ] Install SDK or use REST API
- [ ] Implement OAuth authentication
- [ ] Export transactions to Lexoffice
- [ ] Sync customers/vendors
- [ ] Sync invoices
- [ ] Test integration

**API Endpoints to Use**:
```javascript
// Export transaction to Lexoffice
app.post('/api/integrations/lexoffice/export', async (req, res) => {
  const { transactionId } = req.body;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { entity: true, attachments: true }
  });

  // Convert to Lexoffice format
  const lexofficeInvoice = {
    voucherDate: transaction.transactionDate,
    totalGrossAmount: transaction.amount,
    taxType: 'gross',
    useCollectiveContact: false,
    voucherItems: [{
      amount: transaction.amount,
      categoryId: mapCategoryToLexoffice(transaction.category),
      taxRate: 19
    }],
    files: transaction.attachments.map(a => ({
      fileName: a.originalName,
      content: fs.readFileSync(a.filePath, 'base64')
    }))
  };

  // Send to Lexoffice
  const lexofficeRes = await fetch('https://api.lexoffice.io/v1/vouchers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LEXOFFICE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lexofficeInvoice)
  });

  const result = await lexofficeRes.json();
  res.json({ success: true, lexofficeId: result.id });
});
```

### Task 5.3: DATEV Integration
**Priority**: 🟡 MEDIUM
**Estimated Time**: 5 days

**Tasks**:
- [ ] Apply for DATEV Connect access
- [ ] Complete certification process (may take weeks)
- [ ] Implement DATEV export format
- [ ] Generate DATEV CSV files
- [ ] Test with DATEV accountant
- [ ] Implement automatic export

**DATEV CSV Format**:
```csv
Umsatz (ohne Soll/Haben-Kz);Soll/Haben-Kennzeichen;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto;BU-Schlüssel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;...
1500,00;S;EUR;1,000;1500,00;EUR;4200;1200;0;0103;RE123;;0,00;Miete Januar
```

---

## Phase 6: Enhanced Entity Management (Weeks 16-17)

### Task 6.1: Entity Hierarchy
**Priority**: 🟡 MEDIUM
**Estimated Time**: 3 days

**Tasks**:
- [ ] Add parent-child relationships between entities
- [ ] Allow multi-level hierarchy (Company > Department > Team)
- [ ] Implement cascading permissions
- [ ] Show hierarchy tree view
- [ ] Allow drag-and-drop reorganization

### Task 6.2: Entity Dashboard
**Priority**: 🟡 MEDIUM
**Estimated Time**: 3 days

**Tasks**:
- [ ] Create detailed entity dashboard
- [ ] Show key metrics per entity:
  - Revenue
  - Expenses
  - Profit margin
  - Cash flow
  - Bank account balances
  - Pending payments
- [ ] Add charts and graphs
- [ ] Allow date range selection
- [ ] Export dashboard to PDF

### Task 6.3: Entity Consolidation
**Priority**: 🟡 MEDIUM
**Estimated Time**: 2 days

**Tasks**:
- [ ] Improve consolidation view
- [ ] Add inter-entity transactions
- [ ] Eliminate internal transactions
- [ ] Show consolidated balance sheet
- [ ] Export consolidated reports

---

## Phase 7: Testing & Quality Assurance (Weeks 18-20)

### Task 7.1: Complete Test Suite
**Priority**: 🔴 HIGH
**Estimated Time**: 2 weeks

**Tasks**:
- [ ] Write unit tests for all backend endpoints (see TEST_COVERAGE_ANALYSIS.md)
- [ ] Write frontend unit tests
- [ ] Write integration tests
- [ ] Write E2E tests (Playwright)
- [ ] Achieve 80% code coverage
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Run tests on every commit

### Task 7.2: Performance Testing
**Priority**: 🟠 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Install: `npm install autocannon`
- [ ] Load test API endpoints
- [ ] Optimize slow queries
- [ ] Add database indexes
- [ ] Implement caching (Redis)
- [ ] Test with 100+ concurrent users

### Task 7.3: Security Audit
**Priority**: 🔴 HIGH
**Estimated Time**: 3 days

**Tasks**:
- [ ] Run security scanner: `npm audit`
- [ ] Fix all critical vulnerabilities
- [ ] Penetration testing (manual or automated)
- [ ] Check for OWASP Top 10 vulnerabilities
- [ ] Implement Content Security Policy (CSP)
- [ ] Add SQL injection tests
- [ ] Add XSS tests

### Task 7.4: User Acceptance Testing (UAT)
**Priority**: 🟠 HIGH
**Estimated Time**: 1 week

**Tasks**:
- [ ] Recruit 5-10 beta testers
- [ ] Create test scenarios
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Iterate based on feedback

---

## Phase 8: Production Deployment (Week 21)

### Task 8.1: Choose Hosting Provider
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day

**Options**:
1. **Hetzner** (Germany) - Cost-effective, GDPR compliant
2. **AWS** - Scalable, global
3. **DigitalOcean** - Simple, affordable
4. **Render** - Easy deployment
5. **Railway** - Modern platform

**Recommendation**: **Hetzner** for GDPR compliance and EU data residency

### Task 8.2: Set Up Production Environment
**Priority**: 🔴 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Provision server (VPS or cloud)
- [ ] Install Node.js, PostgreSQL
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure domain and DNS
- [ ] Set up firewall
- [ ] Install monitoring (PM2, Prometheus)
- [ ] Set up logging (Winston, Loggly)
- [ ] Configure backups (automated daily)

### Task 8.3: Deploy Application
**Priority**: 🔴 HIGH
**Estimated Time**: 1 day

**Tasks**:
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Create production build
- [ ] Run database migrations
- [ ] Deploy to production
- [ ] Configure environment variables
- [ ] Test production deployment
- [ ] Set up monitoring alerts

### Task 8.4: Documentation & Training
**Priority**: 🟠 HIGH
**Estimated Time**: 2 days

**Tasks**:
- [ ] Write user documentation
- [ ] Create video tutorials
- [ ] Document admin procedures
- [ ] Create FAQ
- [ ] Train support team

---

## 📋 Complete Task Checklist

### Phase 0: Security (Week 1)
- [ ] Fix password hashing (bcrypt)
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Add CORS & security headers
- [ ] Run security tests

### Phase 1: Bill Upload (Weeks 2-4)
- [ ] File upload infrastructure
- [ ] Bill management UI
- [ ] OCR & data extraction
- [ ] Link bills to transactions
- [ ] Test file upload

### Phase 2: Database (Weeks 5-6)
- [ ] Choose database (PostgreSQL)
- [ ] Design schema
- [ ] Implement ORM (Prisma)
- [ ] Migrate data from JSON
- [ ] Test database operations

### Phase 3: Mobile (Weeks 7-8)
- [ ] Responsive design audit
- [ ] Mobile-first CSS
- [ ] Mobile navigation
- [ ] PWA implementation
- [ ] Test on devices

### Phase 4: Banking (Weeks 9-12)
- [ ] Research banking APIs (FinAPI)
- [ ] Set up API account
- [ ] Bank account connection
- [ ] Transaction sync
- [ ] Reconciliation UI
- [ ] Payment initiation (optional)

### Phase 5: Accounting (Weeks 13-15)
- [ ] Research accounting software
- [ ] Lexoffice integration
- [ ] DATEV integration
- [ ] Test integrations

### Phase 6: Entity Management (Weeks 16-17)
- [ ] Entity hierarchy
- [ ] Entity dashboard
- [ ] Consolidation improvements

### Phase 7: Testing (Weeks 18-20)
- [ ] Complete test suite (80% coverage)
- [ ] Performance testing
- [ ] Security audit
- [ ] User acceptance testing

### Phase 8: Deployment (Week 21)
- [ ] Choose hosting
- [ ] Set up production
- [ ] Deploy application
- [ ] Documentation & training

---

## 💰 Budget Estimation

### Development Costs (if outsourcing)
| Phase | Hours | Rate (€/hr) | Cost |
|-------|-------|-------------|------|
| Phase 0 | 40 | €80 | €3,200 |
| Phase 1 | 80 | €80 | €6,400 |
| Phase 2 | 80 | €80 | €6,400 |
| Phase 3 | 80 | €80 | €6,400 |
| Phase 4 | 120 | €80 | €9,600 |
| Phase 5 | 80 | €80 | €6,400 |
| Phase 6 | 80 | €80 | €6,400 |
| Phase 7 | 120 | €80 | €9,600 |
| Phase 8 | 40 | €80 | €3,200 |
| **Total** | **720** | | **€57,600** |

### Infrastructure Costs (Monthly)
| Service | Cost/Month |
|---------|------------|
| Hetzner VPS (CX51) | €30 |
| PostgreSQL Database | €15 |
| File Storage (S3/MinIO) | €10 |
| FinAPI (Banking API) | €200-500 |
| OCR (Google Cloud Vision) | €50-200 |
| SSL Certificate | Free (Let's Encrypt) |
| Monitoring | €20 |
| Backups | €10 |
| **Total** | **€335-785/month** |

### One-Time Costs
| Item | Cost |
|------|------|
| DATEV Certification | €500-1000 |
| Security Audit | €2000-5000 |
| Logo/Design | €500-2000 |
| **Total** | **€3000-8000** |

---

## 🚀 Quick Start Guide

### For Immediate Development

1. **Install Dependencies** (5 minutes):
```bash
npm install bcrypt joi express-rate-limit helmet multer sharp pdf-parse @prisma/client node-cron
```

2. **Fix Security Issues** (Today):
   - Replace password hashing with bcrypt
   - Run `npm test` to ensure security tests pass

3. **Set Up File Upload** (This Week):
   - Create `uploads/` directory
   - Implement file upload endpoint
   - Create bill upload UI

4. **Database Migration** (Next Week):
   - Set up PostgreSQL
   - Design schema
   - Install Prisma
   - Migrate data

5. **Banking Integration** (Week 3-4):
   - Sign up for FinAPI sandbox
   - Implement bank connection
   - Test with sandbox data

---

## 📞 Support & Resources

### Documentation Links
- **FinAPI Docs**: https://docs.finapi.io/
- **Lexoffice API**: https://developers.lexoffice.io/
- **Prisma Docs**: https://www.prisma.io/docs
- **Multer (File Upload)**: https://github.com/expressjs/multer
- **Google Cloud Vision**: https://cloud.google.com/vision/docs

### Community
- **GitHub Issues**: For bug reports
- **Stack Overflow**: For technical questions
- **r/webdev**: For general web development

---

## ✅ Success Criteria

The Kontiq app will be considered **production-ready** when:

1. ✅ All security vulnerabilities fixed
2. ✅ Bill upload working on desktop & mobile
3. ✅ Database migration complete
4. ✅ Mobile-responsive on all pages
5. ✅ Banking integration functional
6. ✅ At least 1 accounting software integration
7. ✅ 80% test coverage
8. ✅ Performance: < 2s page load
9. ✅ Deployed to production with monitoring
10. ✅ 10+ successful beta users

---

**Total Timeline**: 18-22 weeks (~4-5 months)
**Recommended Team**: 2-3 developers + 1 designer
**Priority**: Start with Phase 0 (Security) immediately!

Good luck! 🚀
