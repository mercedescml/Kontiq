# KONTIQ PRODUCTION ARCHITECTURE

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Web App (Vanilla JS SPA)          │  Mobile App (Future)      │
│  - HTML/CSS/JavaScript              │  - React Native / Flutter │
│  - Chart.js visualizations          │  - Offline-first          │
│  - Service Worker (PWA)             │  - Push notifications     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / BACKEND                       │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express.js                                           │
│  ├── Authentication Middleware (JWT)                            │
│  ├── Rate Limiting (express-rate-limit)                         │
│  ├── Input Validation (Joi)                                     │
│  ├── Error Handling                                             │
│  └── Logging (Winston)                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Services (Modular Architecture)                                │
│  ├── PaymentService          ├── ForecastingService            │
│  ├── InvoiceService          ├── AlertService                  │
│  ├── SkontoService           ├── IntegrationService            │
│  ├── SupplierService         ├── NotificationService           │
│  └── KPIService              └── ExportService                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ORM/Query Builder: Prisma or TypeORM                           │
│  ├── Models (User, Payment, Invoice, etc.)                      │
│  ├── Repositories (Data access patterns)                        │
│  └── Migrations (Version controlled schema)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL 14+ (Primary Database)                              │
│  ├── users, companies                                           │
│  ├── payments, invoices, suppliers                              │
│  ├── bank_accounts, transactions                                │
│  ├── forecasts, alerts                                          │
│  └── audit_logs                                                 │
│                                                                  │
│  Redis (Caching & Sessions)                                     │
│  ├── Session storage                                            │
│  ├── KPI caching (15-min TTL)                                   │
│  └── Rate limiting counters                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────┤
│  Banking APIs                │  Accounting Software             │
│  ├── FinAPI (Primary)        │  ├── DATEV Connect API          │
│  ├── Tink (Backup)           │  ├── Lexoffice API              │
│  └── EBICS (Enterprise)      │  └── Sevdesk API                │
│                              │                                  │
│  Cloud Services              │  Communication                   │
│  ├── AWS S3 (File storage)   │  ├── SendGrid (Email)           │
│  ├── Google Cloud Vision     │  ├── Twilio (SMS)               │
│  │   (OCR)                   │  └── Firebase (Push)            │
│  └── AWS Lambda (Jobs)       │                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOBS / WORKERS                     │
├─────────────────────────────────────────────────────────────────┤
│  Bull Queue + Redis                                             │
│  ├── Daily forecast generation                                  │
│  ├── Alert checking (every 6 hours)                             │
│  ├── Email sending queue                                        │
│  ├── Bank sync jobs                                             │
│  ├── OCR processing queue                                       │
│  └── Report generation                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 MONITORING & OBSERVABILITY                       │
├─────────────────────────────────────────────────────────────────┤
│  ├── Sentry (Error tracking)                                    │
│  ├── Winston + CloudWatch (Logging)                             │
│  ├── Prometheus + Grafana (Metrics)                             │
│  └── Uptime monitoring                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA (PostgreSQL)

### **2.1 Core Tables**

```sql
-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_form VARCHAR(50),
    vat_id VARCHAR(50),
    trade_register VARCHAR(100),
    industry VARCHAR(100),
    employee_count INT,
    annual_revenue DECIMAL(15,2),
    address JSONB,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'employee', -- 'geschaeftsfuehrer', 'manager', 'employee'
    phone VARCHAR(50),
    avatar_url TEXT,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- Entities (Subsidiaries/Branches)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'standard', -- 'hauptsitz', 'standard'
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_entities_company ON entities(company_id);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    category VARCHAR(100), -- 'materials', 'utilities', 'services', etc.
    criticality VARCHAR(50) DEFAULT 'important', -- 'critical', 'important', 'optional'
    risk_score INT DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    flexibility_score INT DEFAULT 50,
    relationship_years INT DEFAULT 0,
    annual_spend DECIMAL(15,2) DEFAULT 0,
    avg_payment_delay INT DEFAULT 0, -- days (negative = early)
    last_penalty_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_suppliers_risk_score ON suppliers(risk_score);

-- Bank Accounts
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    bank_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    iban VARCHAR(34) NOT NULL,
    bic VARCHAR(11),
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    account_type VARCHAR(50) DEFAULT 'checking', -- 'checking', 'savings', 'credit_line'
    credit_limit DECIMAL(15,2) DEFAULT 0,
    external_id VARCHAR(255), -- ID from banking API (FinAPI)
    last_synced TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_bank_accounts_company ON bank_accounts(company_id);
CREATE INDEX idx_bank_accounts_external_id ON bank_accounts(external_id);

-- Invoices/Receivables (Forderungen)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    invoice_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_id UUID, -- Future: link to customers table
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'paid', 'overdue', 'cancelled'
    skonto_percentage DECIMAL(5,2) DEFAULT 0,
    skonto_deadline DATE,
    skonto_amount DECIMAL(15,2) DEFAULT 0,
    skonto_status VARCHAR(50) DEFAULT 'available', -- 'available', 'captured', 'missed', 'expired'
    paid_date DATE,
    paid_amount DECIMAL(15,2),
    payment_method VARCHAR(50),
    notes TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_skonto_deadline ON invoices(skonto_deadline);

-- Payments (Zahlungen)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    supplier_id UUID REFERENCES suppliers(id),
    invoice_number VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    category VARCHAR(100),
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'failed', 'cancelled'
    priority VARCHAR(50) DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
    skonto_percentage DECIMAL(5,2) DEFAULT 0,
    skonto_deadline DATE,
    skonto_amount DECIMAL(15,2) DEFAULT 0,
    scheduled_date DATE,
    execution_date DATE,
    bank_account_id UUID REFERENCES bank_accounts(id),
    external_payment_id VARCHAR(255), -- ID from banking API
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);

-- Costs (Kosten)
CREATE TABLE costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'recorded', -- 'recorded', 'paid'
    payment_method VARCHAR(50),
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_costs_company ON costs(company_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_costs_category ON costs(category);

-- Contracts (Verträge)
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    name VARCHAR(255) NOT NULL,
    partner VARCHAR(255),
    contract_number VARCHAR(100),
    type VARCHAR(100), -- 'rent', 'insurance', 'license', 'lease', 'service'
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_frequency VARCHAR(50), -- 'monthly', 'quarterly', 'annually', 'one_time'
    start_date DATE,
    end_date DATE,
    notice_period_days INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expiring', 'expired', 'cancelled'
    auto_renewal BOOLEAN DEFAULT false,
    description TEXT,
    document_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_contracts_company ON contracts(company_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);

-- Forecasts
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    horizon_days INT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    forecast_data JSONB NOT NULL, -- Array of daily predictions
    accuracy_score DECIMAL(5,2), -- Calculated after actual date passes
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_forecasts_company ON forecasts(company_id);
CREATE INDEX idx_forecasts_date ON forecasts(forecast_date);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'cash_below_buffer', 'skonto_deadline', 'negative_cash', etc.
    severity VARCHAR(50) NOT NULL, -- 'critical', 'urgent', 'warning', 'info'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    actions JSONB DEFAULT '[]', -- Array of possible actions
    trigger_date DATE,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_alerts_company ON alerts(company_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'payment_approved', 'invoice_created', 'supplier_added', etc.
    entity_type VARCHAR(50), -- 'payment', 'invoice', 'supplier', etc.
    entity_id UUID,
    changes JSONB, -- Before/after snapshot
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id), -- NULL = global permission
    module VARCHAR(100) NOT NULL, -- 'payments', 'invoices', 'reports', etc.
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entity_id, module)
);
CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_entity ON permissions(entity_id);

-- Integration Credentials (Encrypted)
CREATE TABLE integration_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'finapi', 'datev', 'lexoffice', etc.
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP,
    additional_data JSONB, -- Integration-specific data
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_integration_credentials_company ON integration_credentials(company_id);
CREATE INDEX idx_integration_credentials_type ON integration_credentials(integration_type);
```

---

## 3. MIGRATION STRATEGY: JSON → PostgreSQL

### **Phase 1: Parallel Run (Week 1-2)**
```javascript
// Dual-write approach: write to both JSON and PostgreSQL
// Read from JSON (existing behavior)
// Validate PostgreSQL writes

class DataMigrationService {
    async savePayment(paymentData) {
        // Write to JSON (existing)
        await this.saveToJSON('zahlungen.json', paymentData);

        // Write to PostgreSQL (new)
        try {
            await db.payments.create(paymentData);
        } catch (error) {
            // Log error but don't fail request
            logger.error('PostgreSQL write failed', error);
        }

        return paymentData;
    }
}
```

### **Phase 2: Data Migration (Week 2)**
```javascript
// migrate-data.js - One-time migration script
const fs = require('fs');
const db = require('./db');

async function migrateAllData() {
    console.log('Starting data migration...');

    // 1. Migrate companies (from onboarding.json)
    const onboarding = JSON.parse(fs.readFileSync('./data/onboarding.json'));
    for (const [email, data] of Object.entries(onboarding)) {
        await db.companies.create({
            name: data.company,
            legal_form: data.legalForm,
            vat_id: data.vatId,
            // ... map all fields
        });
    }

    // 2. Migrate users
    const users = JSON.parse(fs.readFileSync('./data/users.json'));
    for (const user of users) {
        await db.users.create({
            email: user.email,
            name: user.name,
            password_hash: user.passwordHash,
            // ... map all fields
        });
    }

    // 3. Migrate payments
    const payments = JSON.parse(fs.readFileSync('./data/zahlungen.json'));
    // ...

    // 4. Migrate invoices
    // 5. Migrate bank accounts
    // 6. Migrate contracts
    // etc.

    console.log('Migration complete!');
}

migrateAllData().catch(console.error);
```

### **Phase 3: Read from PostgreSQL (Week 3)**
```javascript
// Switch all read operations to PostgreSQL
// Keep JSON as backup for 1 week

async function getPayments(companyId) {
    // Read from PostgreSQL
    return await db.payments.findAll({
        where: { company_id: companyId },
        order: [['due_date', 'ASC']]
    });
}
```

### **Phase 4: Remove JSON (Week 4)**
```javascript
// After 1 week of successful PostgreSQL operation:
// - Move JSON files to /data/archive/
// - Remove all fs.readFileSync/writeFileSync code
// - Clean up code
```

---

## 4. AUTHENTICATION & SECURITY

### **4.1 JWT-Based Authentication**
```javascript
// auth-middleware.js
const jwt = require('jsonwebtoken');

function generateToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            companyId: user.company_id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { generateToken, authenticateToken };
```

### **4.2 Password Security**
```javascript
// Already implemented with bcrypt, just ensure:
const SALT_ROUNDS = 12; // Higher = more secure but slower

async function hashPassword(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hash) {
    return await bcrypt.compare(plainPassword, hash);
}
```

### **4.3 Rate Limiting**
```javascript
// rate-limit.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts, please try again later.'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 requests per window
    message: 'Too many requests, please slow down.'
});

// Apply to routes
app.post('/api/users/login', authLimiter, loginHandler);
app.use('/api/', apiLimiter);
```

### **4.4 Input Sanitization**
```javascript
// sanitize.js
const { sanitize } = require('express-validator');

function sanitizeInput(req, res, next) {
    // Remove HTML tags, prevent XSS
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key]
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .trim();
        }
    }
    next();
}

module.exports = { sanitizeInput };
```

---

## 5. CACHING STRATEGY (Redis)

```javascript
// cache-service.js
const redis = require('redis');
const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

class CacheService {
    async get(key) {
        return new Promise((resolve, reject) => {
            client.get(key, (err, data) => {
                if (err) reject(err);
                resolve(data ? JSON.parse(data) : null);
            });
        });
    }

    async set(key, value, ttlSeconds = 900) { // 15 min default
        return new Promise((resolve, reject) => {
            client.setex(key, ttlSeconds, JSON.stringify(value), (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async invalidate(key) {
        return new Promise((resolve, reject) => {
            client.del(key, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
}

// Usage in KPI calculation
async function getKPIs(companyId) {
    const cacheKey = `kpis:${companyId}`;

    // Try cache first
    let kpis = await cache.get(cacheKey);

    if (!kpis) {
        // Calculate from database
        kpis = await calculateKPIs(companyId);

        // Cache for 15 minutes
        await cache.set(cacheKey, kpis, 900);
    }

    return kpis;
}
```

---

## 6. BACKGROUND JOBS (Bull Queue)

```javascript
// jobs/queue.js
const Queue = require('bull');

const forecastQueue = new Queue('forecasts', {
    redis: { host: 'localhost', port: 6379 }
});

const alertQueue = new Queue('alerts', {
    redis: { host: 'localhost', port: 6379 }
});

const emailQueue = new Queue('emails', {
    redis: { host: 'localhost', port: 6379 }
});

// jobs/workers.js
forecastQueue.process(async (job) => {
    const { companyId } = job.data;

    console.log(`Generating forecast for company ${companyId}`);

    const forecast = await ForecastingService.generate(companyId, 90);
    await db.forecasts.create({
        company_id: companyId,
        forecast_date: new Date(),
        horizon_days: 90,
        forecast_data: forecast
    });

    console.log(`Forecast complete for company ${companyId}`);
});

alertQueue.process(async (job) => {
    const { companyId } = job.data;

    console.log(`Checking alerts for company ${companyId}`);

    const alerts = await AlertService.checkAndGenerate(companyId);

    for (const alert of alerts) {
        if (alert.severity === 'critical' || alert.severity === 'urgent') {
            // Send email immediately
            await emailQueue.add({ type: 'alert', alert, companyId });
        }
    }
});

emailQueue.process(async (job) => {
    const { type, alert, companyId } = job.data;

    if (type === 'alert') {
        await NotificationService.sendAlertEmail(companyId, alert);
    }
});

// Schedule jobs
const cron = require('node-cron');

// Daily forecast generation at 6 AM
cron.schedule('0 6 * * *', async () => {
    const companies = await db.companies.findAll({ where: { is_active: true } });

    for (const company of companies) {
        await forecastQueue.add({ companyId: company.id });
    }
});

// Alert checking every 6 hours
cron.schedule('0 */6 * * *', async () => {
    const companies = await db.companies.findAll({ where: { is_active: true } });

    for (const company of companies) {
        await alertQueue.add({ companyId: company.id });
    }
});
```

---

## 7. ERROR HANDLING & LOGGING

```javascript
// error-handler.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

function errorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;

    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.userId
    });

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        res.status(500).json({
            error: 'Something went wrong. Please try again later.'
        });
    } else {
        res.status(err.statusCode).json({
            error: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
}

module.exports = { AppError, errorHandler, logger };
```

---

## 8. DEPLOYMENT ARCHITECTURE

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/kontiq
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=kontiq
      - POSTGRES_USER=kontiq_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

  worker:
    build: .
    command: node jobs/workers.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/kontiq
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: always

volumes:
  postgres_data:
  redis_data:
```

---

## 9. ENVIRONMENT VARIABLES

```bash
# .env.example
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kontiq

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-256-bit-secret-here-change-in-production

# FinAPI (Banking)
FINAPI_CLIENT_ID=your-client-id
FINAPI_CLIENT_SECRET=your-client-secret
FINAPI_BASE_URL=https://sandbox.finapi.io

# DATEV
DATEV_API_KEY=your-api-key
DATEV_API_SECRET=your-api-secret

# SendGrid (Email)
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@kontiq.de

# Google Cloud (OCR)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json

# AWS S3 (File Storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=kontiq-files
AWS_REGION=eu-central-1

# Sentry (Error Tracking)
SENTRY_DSN=your-sentry-dsn

# App
APP_URL=https://app.kontiq.de
COMPANY_EMAIL=support@kontiq.de
```

---

## 10. API VERSIONING

```javascript
// Support API versioning for future changes
app.use('/api/v1', require('./routes/v1'));
// app.use('/api/v2', require('./routes/v2')); // Future

// routes/v1/index.js
const express = require('express');
const router = express.Router();

router.use('/payments', require('./payments'));
router.use('/invoices', require('./invoices'));
router.use('/kpis', require('./kpis'));
// etc.

module.exports = router;
```

---

This architecture provides:
✅ Scalability (horizontal scaling via load balancer)
✅ Security (JWT, rate limiting, input validation)
✅ Performance (Redis caching, database indexes)
✅ Reliability (background jobs, error handling, logging)
✅ Maintainability (modular structure, clear separation of concerns)
✅ Observability (logging, monitoring, audit trails)
