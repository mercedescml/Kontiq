# KONTIQ IMPLEMENTATION TASKLIST
## Step-by-Step Guide to Production Readiness

---

## PHASE 0: PREPARATION (Day 1)

### ✅ TASK 0.1: Set Up Development Environment
**Time:** 2 hours

```bash
# 1. Install PostgreSQL
# macOS:
brew install postgresql@14
brew services start postgresql@14

# Linux:
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# 2. Install Redis
# macOS:
brew install redis
brew services start redis

# Linux:
sudo apt install redis-server
sudo systemctl start redis

# 3. Create database
createdb kontiq_dev
createdb kontiq_test

# 4. Install new dependencies
npm install --save pg sequelize
npm install --save redis bull node-cron
npm install --save jsonwebtoken express-rate-limit
npm install --save winston
npm install --save pdfkit exceljs
npm install --save @sendgrid/mail
npm install --save dotenv

# 5. Install dev dependencies
npm install --save-dev sequelize-cli nodemon

# 6. Create environment file
cp .env.example .env
# Edit .env with your credentials
```

**Files to create:**
- `.env.example`
- `.env` (local, not committed)
- `.gitignore` (update to exclude .env)

**Verification:**
```bash
# Test PostgreSQL connection
psql -d kontiq_dev -c "SELECT version();"

# Test Redis connection
redis-cli ping
# Should return: PONG
```

---

## PHASE 1: DATABASE SETUP (Days 2-3)

### ✅ TASK 1.1: Initialize Sequelize
**Time:** 1 hour

```bash
# Initialize Sequelize
npx sequelize-cli init

# This creates:
# - config/config.json
# - models/
# - migrations/
# - seeders/
```

**Edit `config/config.json`:**
```json
{
  "development": {
    "username": "your_username",
    "password": null,
    "database": "kontiq_dev",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
}
```

---

### ✅ TASK 1.2: Create Database Models
**Time:** 4-6 hours

Create these files in `models/`:

**`models/company.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      Company.hasMany(models.User, { foreignKey: 'company_id' });
      Company.hasMany(models.Entity, { foreignKey: 'company_id' });
      Company.hasMany(models.Payment, { foreignKey: 'company_id' });
      Company.hasMany(models.Invoice, { foreignKey: 'company_id' });
      Company.hasMany(models.Supplier, { foreignKey: 'company_id' });
    }
  }

  Company.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    legal_form: DataTypes.STRING,
    vat_id: DataTypes.STRING,
    trade_register: DataTypes.STRING,
    industry: DataTypes.STRING,
    employee_count: DataTypes.INTEGER,
    annual_revenue: DataTypes.DECIMAL(15, 2),
    address: DataTypes.JSONB,
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Company',
    tableName: 'companies',
    underscored: true
  });

  return Company;
};
```

**`models/user.js`:**
```javascript
'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Company, { foreignKey: 'company_id' });
    }

    async validatePassword(password) {
      return await bcrypt.compare(password, this.password_hash);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: DataTypes.STRING,
    role: {
      type: DataTypes.STRING,
      defaultValue: 'employee'
    },
    phone: DataTypes.STRING,
    last_login: DataTypes.DATE,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      }
    }
  });

  return User;
};
```

**Create similar models for:**
- `models/entity.js`
- `models/supplier.js`
- `models/bankaccount.js`
- `models/invoice.js`
- `models/payment.js`
- `models/cost.js`
- `models/contract.js`
- `models/forecast.js`
- `models/alert.js`
- `models/auditlog.js`
- `models/permission.js`

*(See PRODUCTION_ARCHITECTURE.md for full schema)*

---

### ✅ TASK 1.3: Create Database Migrations
**Time:** 2-3 hours

```bash
# Generate migrations
npx sequelize-cli migration:generate --name create-companies
npx sequelize-cli migration:generate --name create-users
npx sequelize-cli migration:generate --name create-entities
# ... etc for all tables
```

**Edit each migration file** (example: `migrations/XXXXXX-create-companies.js`):
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      legal_form: Sequelize.STRING,
      vat_id: Sequelize.STRING,
      trade_register: Sequelize.STRING,
      industry: Sequelize.STRING,
      employee_count: Sequelize.INTEGER,
      annual_revenue: Sequelize.DECIMAL(15, 2),
      address: Sequelize.JSONB,
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('companies', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('companies');
  }
};
```

**Run migrations:**
```bash
npx sequelize-cli db:migrate

# Verify tables created
psql -d kontiq_dev -c "\dt"
```

---

### ✅ TASK 1.4: Create Data Migration Script
**Time:** 4-6 hours

**Create `scripts/migrate-json-to-postgres.js`:**
```javascript
const fs = require('fs');
const path = require('path');
const { Company, User, Payment, Invoice, BankAccount, Cost, Contract, Entity } = require('../models');

async function migrateData() {
  console.log('🚀 Starting data migration from JSON to PostgreSQL...\n');

  try {
    // 1. Migrate companies and users together (from onboarding + users)
    console.log('📦 Migrating companies and users...');
    const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    const onboardingData = JSON.parse(fs.readFileSync('./data/onboarding.json', 'utf8'));

    const emailToCompanyMap = {};

    for (const user of usersData) {
      const onboarding = onboardingData[user.email];

      // Create or find company
      let company = emailToCompanyMap[user.company];
      if (!company) {
        company = await Company.create({
          name: user.company,
          legal_form: onboarding?.legalForm,
          vat_id: onboarding?.vatId,
          trade_register: onboarding?.tradeRegister,
          industry: onboarding?.industry,
          employee_count: onboarding?.employeeCount,
          annual_revenue: onboarding?.annualRevenue,
          address: onboarding?.address,
          settings: {
            min_liquidity: onboarding?.minLiquidity,
            payment_term: onboarding?.paymentTerm
          }
        });
        emailToCompanyMap[user.company] = company;
        console.log(`  ✓ Created company: ${company.name}`);
      }

      // Create user
      await User.create({
        company_id: company.id,
        email: user.email,
        password_hash: user.passwordHash, // Will be hashed by hook
        name: user.name,
        role: 'geschaeftsfuehrer' // Default for migrated users
      });
      console.log(`  ✓ Created user: ${user.email}`);
    }

    // 2. Migrate entities
    console.log('\n📦 Migrating entities...');
    const entitiesData = JSON.parse(fs.readFileSync('./data/entitaeten.json', 'utf8'));
    const entityIdMap = {};

    for (const entity of entitiesData) {
      const company = await Company.findOne({ where: { name: entity.company } });
      if (company) {
        const newEntity = await Entity.create({
          company_id: company.id,
          name: entity.name,
          type: entity.type || 'standard'
        });
        entityIdMap[entity.id] = newEntity.id;
        console.log(`  ✓ Created entity: ${entity.name}`);
      }
    }

    // 3. Migrate bank accounts
    console.log('\n📦 Migrating bank accounts...');
    const bankAccountsData = JSON.parse(fs.readFileSync('./data/bankkonten.json', 'utf8'));

    for (const account of bankAccountsData) {
      const user = await User.findOne({ where: { email: account.userId } });
      if (user) {
        await BankAccount.create({
          company_id: user.company_id,
          bank_name: account.bank,
          account_name: account.accountName,
          iban: account.IBAN,
          balance: account.balance,
          currency: account.currency || 'EUR'
        });
        console.log(`  ✓ Created bank account: ${account.accountName}`);
      }
    }

    // 4. Migrate invoices
    console.log('\n📦 Migrating invoices...');
    const invoicesData = JSON.parse(fs.readFileSync('./data/forderungen.json', 'utf8'));

    for (const invoice of invoicesData) {
      const user = await User.findOne({ where: { email: invoice.userId } });
      if (user) {
        await Invoice.create({
          company_id: user.company_id,
          invoice_number: invoice.id,
          customer_name: invoice.customer,
          amount: invoice.amount,
          invoice_date: new Date(), // Not in original data
          due_date: new Date(invoice.dueDate),
          status: invoice.status,
          skonto_percentage: invoice.skonto,
          skonto_deadline: invoice.skontoDeadline ? new Date(invoice.skontoDeadline) : null,
          skonto_amount: invoice.skonto ? (invoice.amount * invoice.skonto / 100) : 0
        });
        console.log(`  ✓ Created invoice: ${invoice.customer} - €${invoice.amount}`);
      }
    }

    // 5. Migrate payments
    console.log('\n📦 Migrating payments...');
    const paymentsData = JSON.parse(fs.readFileSync('./data/zahlungen.json', 'utf8'));

    for (const payment of paymentsData) {
      const user = await User.findOne({ where: { email: payment.userId } });
      if (user) {
        await Payment.create({
          company_id: user.company_id,
          amount: payment.amount,
          category: payment.category,
          description: payment.description,
          due_date: new Date(payment.date),
          status: payment.status
        });
        console.log(`  ✓ Created payment: ${payment.description} - €${payment.amount}`);
      }
    }

    // 6. Migrate costs
    console.log('\n📦 Migrating costs...');
    const costsData = JSON.parse(fs.readFileSync('./data/kosten.json', 'utf8'));

    for (const cost of costsData) {
      const user = await User.findOne({ where: { email: cost.userId } });
      if (user) {
        await Cost.create({
          company_id: user.company_id,
          amount: cost.amount,
          category: cost.category,
          description: cost.description,
          date: new Date(cost.date),
          status: cost.status
        });
        console.log(`  ✓ Created cost: ${cost.description} - €${cost.amount}`);
      }
    }

    // 7. Migrate contracts
    console.log('\n📦 Migrating contracts...');
    const contractsData = JSON.parse(fs.readFileSync('./data/contracts.json', 'utf8'));

    for (const contract of contractsData) {
      const user = await User.findOne({ where: { email: contract.userId } });
      if (user) {
        await Contract.create({
          company_id: user.company_id,
          name: contract.name,
          partner: contract.partner,
          amount: contract.amount,
          start_date: contract.startDate ? new Date(contract.startDate) : null,
          end_date: contract.endDate ? new Date(contract.endDate) : null,
          status: contract.status,
          description: contract.description
        });
        console.log(`  ✓ Created contract: ${contract.name}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  Companies: ${await Company.count()}`);
    console.log(`  Users: ${await User.count()}`);
    console.log(`  Entities: ${await Entity.count()}`);
    console.log(`  Bank Accounts: ${await BankAccount.count()}`);
    console.log(`  Invoices: ${await Invoice.count()}`);
    console.log(`  Payments: ${await Payment.count()}`);
    console.log(`  Costs: ${await Cost.count()}`);
    console.log(`  Contracts: ${await Contract.count()}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n🎉 All done! You can now switch to PostgreSQL.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

**Run migration:**
```bash
node scripts/migrate-json-to-postgres.js
```

---

## PHASE 2: AUTHENTICATION & SECURITY (Days 4-5)

### ✅ TASK 2.1: Implement JWT Authentication
**Time:** 3-4 hours

**Create `middleware/auth.js`:**
```javascript
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    // Optionally: verify user still exists and is active
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  generateToken,
  authenticateToken,
  requireRole
};
```

**Update `server.js` login endpoint:**
```javascript
const { generateToken } = require('./middleware/auth');

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login
    await user.update({ last_login: new Date() });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.company_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
```

**Protect all API routes:**
```javascript
const { authenticateToken } = require('./middleware/auth');

// Apply to all /api routes (except login/register)
app.use('/api', (req, res, next) => {
  // Skip auth for login and register
  if (req.path === '/users/login' || req.path === '/users/register') {
    return next();
  }
  return authenticateToken(req, res, next);
});
```

---

### ✅ TASK 2.2: Add Rate Limiting
**Time:** 1 hour

**Create `middleware/rate-limit.js`:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter };
```

**Apply to server.js:**
```javascript
const { authLimiter, apiLimiter } = require('./middleware/rate-limit');

app.post('/api/users/login', authLimiter, loginHandler);
app.post('/api/users/register', authLimiter, registerHandler);
app.use('/api/', apiLimiter);
```

---

### ✅ TASK 2.3: Add Input Validation & Sanitization
**Time:** 2-3 hours

**Create `middleware/validate.js`:**
```javascript
const Joi = require('joi');

function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({ errors });
    }

    next();
  };
}

// Validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  }),

  payment: Joi.object({
    amount: Joi.number().positive().required(),
    category: Joi.string().required(),
    description: Joi.string().max(500),
    due_date: Joi.date().required(),
    supplier_id: Joi.string().uuid(),
    skonto_percentage: Joi.number().min(0).max(100),
    skonto_deadline: Joi.date()
  }),

  invoice: Joi.object({
    invoice_number: Joi.string().required(),
    customer_name: Joi.string().required(),
    amount: Joi.number().positive().required(),
    invoice_date: Joi.date().required(),
    due_date: Joi.date().required(),
    skonto_percentage: Joi.number().min(0).max(100),
    skonto_deadline: Joi.date()
  })
};

module.exports = { validateRequest, schemas };
```

**Apply to routes:**
```javascript
const { validateRequest, schemas } = require('./middleware/validate');

app.post('/api/payments', authenticateToken, validateRequest(schemas.payment), createPayment);
app.post('/api/forderungen', authenticateToken, validateRequest(schemas.invoice), createInvoice);
```

---

## PHASE 3: FIX CRITICAL BUGS (Day 6)

### ✅ TASK 3.1: Fix Dashboard Zero-Data Bug
**Time:** 1-2 hours

**Problem:** `/api/dashboard` returns hardcoded zeros

**Solution:** Connect to real KPI calculations

**Edit `server.js`:**
```javascript
// BEFORE (line ~124):
app.get('/api/dashboard', (req, res) => {
  res.json({
    liquiditaet: 0,
    skontoMoeglichkeiten: 0,
    faelligeZahlungen: 0
  });
});

// AFTER:
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Get real data
    const [
      bankAccounts,
      invoices,
      payments,
      costs
    ] = await Promise.all([
      BankAccount.findAll({ where: { company_id: companyId } }),
      Invoice.findAll({ where: { company_id: companyId, status: 'open' } }),
      Payment.findAll({ where: { company_id: companyId, status: 'pending' } }),
      Cost.findAll({
        where: {
          company_id: companyId,
          date: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    // Calculate liquidity
    const liquiditaet = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    // Calculate Skonto opportunities (invoices with skonto deadline in next 7 days)
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const skontoMoeglichkeiten = invoices
      .filter(inv => inv.skonto_deadline &&
                     inv.skonto_deadline >= today &&
                     inv.skonto_deadline <= nextWeek)
      .reduce((sum, inv) => sum + parseFloat(inv.skonto_amount || 0), 0);

    // Count due payments (due in next 7 days)
    const faelligeZahlungen = payments
      .filter(p => p.due_date && p.due_date <= nextWeek)
      .length;

    res.json({
      liquiditaet: liquiditaet.toFixed(2),
      skontoMoeglichkeiten: skontoMoeglichkeiten.toFixed(2),
      faelligeZahlungen
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});
```

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/dashboard
```

---

### ✅ TASK 3.2: Implement Real PDF Export
**Time:** 3-4 hours

**Install:**
```bash
npm install pdfkit
```

**Create `services/pdf-service.js`:**
```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  static async generatePaymentReport(companyId, payments) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `payment-report-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../public/exports', filename);

        // Ensure directory exists
        if (!fs.existsSync(path.dirname(filepath))) {
          fs.mkdirSync(path.dirname(filepath), { recursive: true });
        }

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('Zahlungsbericht', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, { align: 'right' });
        doc.moveDown(2);

        // Table header
        doc.fontSize(12).font('Helvetica-Bold');
        const tableTop = 150;
        doc.text('Datum', 50, tableTop);
        doc.text('Beschreibung', 150, tableTop);
        doc.text('Kategorie', 350, tableTop);
        doc.text('Betrag', 480, tableTop, { width: 70, align: 'right' });

        // Table rows
        doc.font('Helvetica').fontSize(10);
        let y = tableTop + 20;

        payments.forEach(payment => {
          doc.text(new Date(payment.due_date).toLocaleDateString('de-DE'), 50, y);
          doc.text(payment.description || '-', 150, y, { width: 180 });
          doc.text(payment.category || '-', 350, y);
          doc.text(`€${parseFloat(payment.amount).toFixed(2)}`, 480, y, { width: 70, align: 'right' });
          y += 20;

          // New page if needed
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });

        // Total
        doc.moveDown(2);
        const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Gesamt: €${total.toFixed(2)}`, 480, y + 20, { width: 70, align: 'right' });

        doc.end();

        stream.on('finish', () => {
          resolve(`/exports/${filename}`);
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;
```

**Update `server.js`:**
```javascript
const PDFService = require('./services/pdf-service');

app.post('/api/export/pdf', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const payments = await Payment.findAll({
      where: { company_id: companyId },
      order: [['due_date', 'DESC']]
    });

    const pdfUrl = await PDFService.generatePaymentReport(companyId, payments);

    res.json({ url: pdfUrl });
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
```

---

### ✅ TASK 3.3: Implement Real Excel Export
**Time:** 2-3 hours

**Install:**
```bash
npm install exceljs
```

**Create `services/excel-service.js`:**
```javascript
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelService {
  static async generatePaymentReport(companyId, payments) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Zahlungen');

      // Define columns
      worksheet.columns = [
        { header: 'Datum', key: 'date', width: 12 },
        { header: 'Beschreibung', key: 'description', width: 30 },
        { header: 'Kategorie', key: 'category', width: 15 },
        { header: 'Lieferant', key: 'supplier', width: 20 },
        { header: 'Betrag', key: 'amount', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Skonto %', key: 'skonto', width: 10 },
        { header: 'Skonto Frist', key: 'skonto_deadline', width: 12 }
      ];

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Add data
      payments.forEach(payment => {
        worksheet.addRow({
          date: new Date(payment.due_date).toLocaleDateString('de-DE'),
          description: payment.description,
          category: payment.category,
          supplier: payment.supplier?.name || '-',
          amount: parseFloat(payment.amount),
          status: payment.status,
          skonto: payment.skonto_percentage || 0,
          skonto_deadline: payment.skonto_deadline
            ? new Date(payment.skonto_deadline).toLocaleDateString('de-DE')
            : '-'
        });
      });

      // Format amount column as currency
      worksheet.getColumn('amount').numFmt = '€#,##0.00';

      // Add total row
      const totalRow = worksheet.addRow({
        description: 'GESAMT',
        amount: { formula: `SUM(E2:E${payments.length + 1})` }
      });
      totalRow.font = { bold: true };

      // Save file
      const filename = `payment-report-${Date.now()}.xlsx`;
      const filepath = path.join(__dirname, '../public/exports', filename);

      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      await workbook.xlsx.writeFile(filepath);

      return `/exports/${filename}`;

    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExcelService;
```

**Update `server.js`:**
```javascript
const ExcelService = require('./services/excel-service');

app.post('/api/export/excel', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const payments = await Payment.findAll({
      where: { company_id: companyId },
      include: [{ model: Supplier }],
      order: [['due_date', 'DESC']]
    });

    const excelUrl = await ExcelService.generatePaymentReport(companyId, payments);

    res.json({ url: excelUrl });
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});
```

---

## PHASE 4: SKONTO CAPTURE RATE TRACKING (Day 7)

### ✅ TASK 4.1: Add Skonto Tracking Logic
**Time:** 3-4 hours

**Create `services/skonto-service.js`:**
```javascript
const { Invoice, Payment, Company } = require('../models');
const { Op } = require('sequelize');

class SkontoService {
  /**
   * Calculate Skonto capture rate for a company
   */
  static async calculateCaptureRate(companyId, startDate, endDate) {
    const invoices = await Invoice.findAll({
      where: {
        company_id: companyId,
        invoice_date: {
          [Op.between]: [startDate, endDate]
        },
        skonto_percentage: { [Op.gt]: 0 }
      }
    });

    let totalAvailable = 0;
    let totalCaptured = 0;
    let totalMissed = 0;

    for (const invoice of invoices) {
      const skontoAmount = parseFloat(invoice.skonto_amount);
      totalAvailable += skontoAmount;

      if (invoice.skonto_status === 'captured') {
        totalCaptured += skontoAmount;
      } else if (invoice.skonto_status === 'missed' || invoice.skonto_status === 'expired') {
        totalMissed += skontoAmount;
      }
    }

    const captureRate = totalAvailable > 0 ? (totalCaptured / totalAvailable) * 100 : 0;

    return {
      totalAvailable: totalAvailable.toFixed(2),
      totalCaptured: totalCaptured.toFixed(2),
      totalMissed: totalMissed.toFixed(2),
      captureRate: captureRate.toFixed(1),
      invoiceCount: invoices.length
    };
  }

  /**
   * Update Skonto status based on payment date
   */
  static async updateSkontoStatus(invoiceId, paymentDate) {
    const invoice = await Invoice.findByPk(invoiceId);

    if (!invoice || !invoice.skonto_deadline) {
      return;
    }

    const deadline = new Date(invoice.skonto_deadline);
    const paid = new Date(paymentDate);

    if (paid <= deadline) {
      invoice.skonto_status = 'captured';
    } else {
      invoice.skonto_status = 'missed';
    }

    await invoice.save();
  }

  /**
   * Check for expiring Skonto opportunities
   */
  static async getExpiringSkontoOpportunities(companyId, daysAhead = 3) {
    const today = new Date();
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const invoices = await Invoice.findAll({
      where: {
        company_id: companyId,
        status: 'open',
        skonto_percentage: { [Op.gt]: 0 },
        skonto_deadline: {
          [Op.between]: [today, futureDate]
        }
      },
      order: [['skonto_deadline', 'ASC']]
    });

    return invoices.map(inv => ({
      id: inv.id,
      customer: inv.customer_name,
      amount: inv.amount,
      skontoAmount: inv.skonto_amount,
      skontoPercentage: inv.skonto_percentage,
      deadline: inv.skonto_deadline,
      daysRemaining: Math.ceil((new Date(inv.skonto_deadline) - today) / (1000 * 60 * 60 * 24))
    }));
  }
}

module.exports = SkontoService;
```

**Add API endpoint in `server.js`:**
```javascript
const SkontoService = require('./services/skonto-service');

app.get('/api/skonto/capture-rate', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { startDate, endDate } = req.query;

    // Default to current month
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await SkontoService.calculateCaptureRate(companyId, start, end);

    res.json(stats);
  } catch (error) {
    console.error('Skonto capture rate error:', error);
    res.status(500).json({ error: 'Failed to calculate capture rate' });
  }
});

app.get('/api/skonto/expiring', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const daysAhead = parseInt(req.query.days) || 3;

    const opportunities = await SkontoService.getExpiringSkontoOpportunities(companyId, daysAhead);

    res.json(opportunities);
  } catch (error) {
    console.error('Expiring Skonto error:', error);
    res.status(500).json({ error: 'Failed to get Skonto opportunities' });
  }
});
```

---

### ✅ TASK 4.2: Add Skonto Widget to Dashboard
**Time:** 2 hours

**Edit `public/views/dashboard.html`:**

Add after existing KPI cards:
```html
<div class="kpi-card" id="skonto-capture-card">
  <h3>Skonto-Erfassung</h3>
  <div class="kpi-main">
    <span class="kpi-value" id="skonto-capture-rate">--</span>
    <span class="kpi-unit">%</span>
  </div>
  <div class="kpi-details">
    <p id="skonto-captured">Erfasst: €--</p>
    <p id="skonto-missed">Verpasst: €--</p>
    <p id="skonto-available">Verfügbar: €--</p>
  </div>
  <div class="kpi-trend" id="skonto-trend">
    <span>--</span>
  </div>
</div>
```

**Edit `public/js/dashboard.js`:**

Add function:
```javascript
async function loadSkontoCaptureRate() {
  try {
    const response = await fetch('/api/skonto/capture-rate', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();

    document.getElementById('skonto-capture-rate').textContent = data.captureRate;
    document.getElementById('skonto-captured').textContent = `Erfasst: €${data.totalCaptured}`;
    document.getElementById('skonto-missed').textContent = `Verpasst: €${data.totalMissed}`;
    document.getElementById('skonto-available').textContent = `Verfügbar: €${data.totalAvailable}`;

    // Show trend (if we have last month's data)
    // TODO: Compare with previous month
  } catch (error) {
    console.error('Failed to load Skonto capture rate:', error);
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSkontoCaptureRate();
  // ... other init functions
});
```

---

## PHASE 5: EMAIL NOTIFICATIONS (Days 8-9)

### ✅ TASK 5.1: Set Up SendGrid
**Time:** 1 hour

```bash
npm install @sendgrid/mail
```

**Add to `.env`:**
```
SENDGRID_API_KEY=your-api-key-here
SENDGRID_FROM_EMAIL=noreply@kontiq.de
SENDGRID_FROM_NAME=Kontiq
```

**Create `services/email-service.js`:**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  static async send(to, subject, html) {
    try {
      const msg = {
        to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME
        },
        subject,
        html
      };

      await sgMail.send(msg);
      console.log(`✉️  Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  static async sendSkontoAlert(user, opportunities) {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Skonto-Fristen laufen ab!</h2>
          <p>Hallo ${user.name},</p>
          <p>Sie haben ${opportunities.length} Skonto-Gelegenheiten, die in den nächsten 3 Tagen ablaufen:</p>
          <ul>
            ${opportunities.map(opp => `
              <li>
                <strong>${opp.customer}</strong>: €${opp.skontoAmount} sparen
                (Frist: ${new Date(opp.deadline).toLocaleDateString('de-DE')})
              </li>
            `).join('')}
          </ul>
          <p>
            <a href="${process.env.APP_URL}/forderungen"
               style="display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
              Jetzt ansehen
            </a>
          </p>
          <p>Viele Grüße,<br>Ihr Kontiq Team</p>
        </body>
      </html>
    `;

    return await this.send(user.email, 'Skonto-Fristen laufen ab!', html);
  }

  static async sendLowCashAlert(user, cashPosition, minBuffer) {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #d32f2f;">⚠️ Liquiditätswarnung</h2>
          <p>Hallo ${user.name},</p>
          <p>Ihre Liquidität ist unter den Mindestpuffer gefallen:</p>
          <p style="font-size: 18px;">
            Aktuell: <strong>€${cashPosition}</strong><br>
            Mindestpuffer: €${minBuffer}
          </p>
          <p>Bitte prüfen Sie Ihre Zahlungen und ergreifen Sie ggf. Maßnahmen.</p>
          <p>
            <a href="${process.env.APP_URL}/liquiditat"
               style="display: inline-block; padding: 12px 24px; background: #d32f2f; color: white; text-decoration: none; border-radius: 4px;">
              Liquidität prüfen
            </a>
          </p>
          <p>Viele Grüße,<br>Ihr Kontiq Team</p>
        </body>
      </html>
    `;

    return await this.send(user.email, '⚠️ Liquiditätswarnung', html);
  }
}

module.exports = EmailService;
```

---

### ✅ TASK 5.2: Create Background Job for Alerts
**Time:** 3-4 hours

**Install Bull:**
```bash
npm install bull
```

**Create `jobs/alert-checker.js`:**
```javascript
const Queue = require('bull');
const { Company, User, Invoice, BankAccount } = require('../models');
const { Op } = require('sequelize');
const SkontoService = require('../services/skonto-service');
const EmailService = require('../services/email-service');

const alertQueue = new Queue('alerts', {
  redis: { host: process.env.REDIS_HOST || 'localhost', port: 6379 }
});

// Process alert jobs
alertQueue.process(async (job) => {
  const { companyId } = job.data;

  try {
    console.log(`Checking alerts for company ${companyId}`);

    const company = await Company.findByPk(companyId);
    const users = await User.findAll({
      where: { company_id: companyId, is_active: true }
    });

    // 1. Check for expiring Skonto opportunities
    const skontoOpp = await SkontoService.getExpiringSkontoOpportunities(companyId, 3);

    if (skontoOpp.length > 0) {
      for (const user of users) {
        await EmailService.sendSkontoAlert(user, skontoOpp);
      }
    }

    // 2. Check for low cash position
    const bankAccounts = await BankAccount.findAll({ where: { company_id: companyId } });
    const totalCash = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const minBuffer = company.settings?.min_liquidity || 5000;

    if (totalCash < minBuffer) {
      for (const user of users) {
        await EmailService.sendLowCashAlert(user, totalCash.toFixed(2), minBuffer.toFixed(2));
      }
    }

    console.log(`Alert check complete for company ${companyId}`);

  } catch (error) {
    console.error(`Alert check failed for company ${companyId}:`, error);
    throw error;
  }
});

module.exports = alertQueue;
```

**Create `jobs/scheduler.js`:**
```javascript
const cron = require('node-cron');
const { Company } = require('../models');
const alertQueue = require('./alert-checker');

// Check alerts every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('🔔 Running scheduled alert check...');

  try {
    const companies = await Company.findAll();

    for (const company of companies) {
      await alertQueue.add({ companyId: company.id });
    }

    console.log(`✅ Queued alert checks for ${companies.length} companies`);
  } catch (error) {
    console.error('Scheduled alert check failed:', error);
  }
});

console.log('📅 Alert scheduler initialized');
```

**Update `server.js` to start scheduler:**
```javascript
// At the top, after other requires
require('./jobs/scheduler');
```

---

## PHASE 6: BANKING INTEGRATION PREP (Days 10-12)

### ✅ TASK 6.1: FinAPI Setup
**Time:** 4-6 hours

**Sign up for FinAPI:**
1. Go to https://finapi.io/
2. Create developer account
3. Get sandbox credentials
4. Read documentation: https://docs.finapi.io/

**Add to `.env`:**
```
FINAPI_CLIENT_ID=your-client-id
FINAPI_CLIENT_SECRET=your-client-secret
FINAPI_BASE_URL=https://sandbox.finapi.io
```

**Install:**
```bash
npm install axios
```

**Create `services/finapi-service.js`:**
```javascript
const axios = require('axios');

class FinAPIService {
  constructor() {
    this.baseURL = process.env.FINAPI_BASE_URL;
    this.clientId = process.env.FINAPI_CLIENT_ID;
    this.clientSecret = process.env.FINAPI_CLIENT_SECRET;
    this.accessToken = null;
  }

  /**
   * Get client access token
   */
  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('FinAPI authentication error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get authorization headers
   */
  async getHeaders() {
    if (!this.accessToken) {
      await this.authenticate();
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a new user in FinAPI
   */
  async createUser(userId, email) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/api/v1/users`,
        {
          id: userId,
          email: email,
          password: generateSecurePassword(), // Generate random password
          isAutoUpdateEnabled: true
        },
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('FinAPI create user error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user access token
   */
  async getUserAccessToken(userId) {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: userId,
        password: 'user-password' // Stored securely
      });

      return response.data.access_token;
    } catch (error) {
      console.error('FinAPI user token error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Import bank connection (Web Form approach)
   */
  async createBankConnection(userAccessToken, bankId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/bankConnections/import`,
        {
          bankId: bankId,
          // For sandbox testing
          storeSecrets: true
        },
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('FinAPI import bank error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all bank accounts for a user
   */
  async getBankAccounts(userAccessToken) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/accounts`,
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`
          }
        }
      );

      return response.data.accounts;
    } catch (error) {
      console.error('FinAPI get accounts error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get transactions for an account
   */
  async getTransactions(userAccessToken, accountIds, fromDate, toDate) {
    try {
      const params = new URLSearchParams({
        accountIds: accountIds.join(','),
        ...(fromDate && { minBankBookingDate: fromDate }),
        ...(toDate && { maxBankBookingDate: toDate })
      });

      const response = await axios.get(
        `${this.baseURL}/api/v1/transactions?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`
          }
        }
      );

      return response.data.transactions;
    } catch (error) {
      console.error('FinAPI get transactions error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Execute a SEPA payment
   */
  async executePayment(userAccessToken, accountId, payment) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/payments`,
        {
          accountId: accountId,
          amount: payment.amount,
          purpose: payment.description,
          recipientName: payment.recipientName,
          recipientIban: payment.recipientIban,
          executionDate: payment.executionDate || new Date().toISOString().split('T')[0]
        },
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('FinAPI execute payment error:', error.response?.data || error.message);
      throw error;
    }
  }
}

function generateSecurePassword() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = new FinAPIService();
```

**Add API endpoints in `server.js`:**
```javascript
const FinAPIService = require('./services/finapi-service');

// Connect bank account
app.post('/api/banking/connect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bankId } = req.body;

    // 1. Create FinAPI user if not exists
    let finapiUser = await IntegrationCredential.findOne({
      where: { company_id: req.user.companyId, integration_type: 'finapi' }
    });

    if (!finapiUser) {
      const user = await User.findByPk(userId);
      await FinAPIService.createUser(userId, user.email);

      finapiUser = await IntegrationCredential.create({
        company_id: req.user.companyId,
        integration_type: 'finapi',
        additional_data: { finapi_user_id: userId }
      });
    }

    // 2. Get user access token
    const userToken = await FinAPIService.getUserAccessToken(userId);

    // 3. Import bank connection
    const connection = await FinAPIService.createBankConnection(userToken, bankId);

    // 4. Sync accounts
    const accounts = await FinAPIService.getBankAccounts(userToken);

    // 5. Save accounts to database
    for (const account of accounts) {
      await BankAccount.findOrCreate({
        where: { external_id: account.id },
        defaults: {
          company_id: req.user.companyId,
          bank_name: account.bankName,
          account_name: account.accountName,
          iban: account.iban,
          balance: account.balance,
          external_id: account.id,
          last_synced: new Date()
        }
      });
    }

    res.json({ success: true, accounts: accounts.length });

  } catch (error) {
    console.error('Bank connection error:', error);
    res.status(500).json({ error: 'Failed to connect bank account' });
  }
});

// Sync bank transactions
app.post('/api/banking/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userToken = await FinAPIService.getUserAccessToken(userId);
    const accounts = await BankAccount.findAll({
      where: { company_id: req.user.companyId }
    });

    let totalTransactions = 0;

    for (const account of accounts) {
      if (!account.external_id) continue;

      // Get transactions from last 30 days
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const transactions = await FinAPIService.getTransactions(
        userToken,
        [account.external_id],
        fromDate
      );

      totalTransactions += transactions.length;

      // Update account balance
      const latestBalance = transactions[0]?.accountBalance;
      if (latestBalance !== undefined) {
        await account.update({
          balance: latestBalance,
          last_synced: new Date()
        });
      }

      // TODO: Import transactions to database
      // (Create transactions table and save transaction data)
    }

    res.json({
      success: true,
      accounts: accounts.length,
      transactions: totalTransactions
    });

  } catch (error) {
    console.error('Bank sync error:', error);
    res.status(500).json({ error: 'Failed to sync bank data' });
  }
});
```

---

## PHASE 7: TESTING & DEPLOYMENT (Days 13-14)

### ✅ TASK 7.1: Write Tests
**Time:** 6-8 hours

**Create `tests/api.test.js`:**
```javascript
const request = require('supertest');
const app = require('../server');
const { User, Company } = require('../models');

describe('Authentication', () => {
  let token;

  beforeAll(async () => {
    // Create test company and user
    const company = await Company.create({
      name: 'Test Company GmbH'
    });

    await User.create({
      company_id: company.id,
      email: 'test@example.com',
      password_hash: 'password123', // Will be hashed
      name: 'Test User',
      role: 'geschaeftsfuehrer'
    });
  });

  test('POST /api/users/login - success', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    token = response.body.token;
  });

  test('POST /api/users/login - invalid credentials', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
  });

  test('GET /api/dashboard - requires authentication', async () => {
    const response = await request(app)
      .get('/api/dashboard');

    expect(response.status).toBe(401);
  });

  test('GET /api/dashboard - with valid token', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('liquiditaet');
    expect(response.body).toHaveProperty('skontoMoeglichkeiten');
  });
});

describe('Payments', () => {
  let token;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'password123' });
    token = response.body.token;
  });

  test('POST /api/payments - create payment', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 1000,
        category: 'Wareneinkauf',
        description: 'Test payment',
        due_date: '2024-12-31'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('GET /api/payments - list payments', async () => {
    const response = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

// Add more tests for invoices, KPIs, etc.
```

**Run tests:**
```bash
npm test
```

---

### ✅ TASK 7.2: Set Up Docker
**Time:** 2-3 hours

**Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create exports directory
RUN mkdir -p public/exports

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
```

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://kontiq:kontiq_password@postgres:5432/kontiq
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./public/exports:/app/public/exports

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=kontiq
      - POSTGRES_USER=kontiq
      - POSTGRES_PASSWORD=kontiq_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  worker:
    build: .
    command: node jobs/scheduler.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://kontiq:kontiq_password@postgres:5432/kontiq
      - REDIS_HOST=redis
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Build and run:**
```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

### ✅ TASK 7.3: Deploy to Railway/Render
**Time:** 2-3 hours

**Option A: Railway.app**

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL and Redis:
```bash
railway add --plugin postgresql
railway add --plugin redis
```

4. Set environment variables:
```bash
railway variables set JWT_SECRET=your-secret
railway variables set SENDGRID_API_KEY=your-key
# etc.
```

5. Deploy:
```bash
railway up
```

**Option B: Render.com**

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: kontiq
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: kontiq-db
          property: connectionString
      - key: REDIS_HOST
        fromService:
          name: kontiq-redis
          property: host

databases:
  - name: kontiq-db
    plan: starter
    ipAllowList: []

  - name: kontiq-redis
    plan: starter
    ipAllowList: []
```

2. Connect GitHub repo
3. Deploy automatically on push

---

## SUMMARY: 14-DAY IMPLEMENTATION CHECKLIST

### **Days 1-3: Database Foundation**
- [x] Install PostgreSQL & Redis
- [x] Set up Sequelize
- [x] Create database models
- [x] Write migrations
- [x] Migrate JSON data to PostgreSQL

### **Days 4-5: Security**
- [x] Implement JWT authentication
- [x] Add rate limiting
- [x] Add input validation
- [x] Secure all API endpoints

### **Day 6: Critical Fixes**
- [x] Fix dashboard zero-data bug
- [x] Implement real PDF export
- [x] Implement real Excel export

### **Day 7: Skonto Tracking**
- [x] Build Skonto service
- [x] Add capture rate calculation
- [x] Add dashboard widget

### **Days 8-9: Notifications**
- [x] Set up SendGrid
- [x] Create email templates
- [x] Build alert system
- [x] Schedule background jobs

### **Days 10-12: Banking Integration**
- [x] FinAPI setup
- [x] Bank connection flow
- [x] Transaction sync
- [x] Account management

### **Days 13-14: Testing & Deployment**
- [x] Write API tests
- [x] Set up Docker
- [x] Deploy to production

---

## NEXT STEPS (Post-Launch)

### **Weeks 3-4: DATEV Integration**
- Apply for DATEV API access
- Implement CSV import
- Build OAuth flow
- Test with real accounting data

### **Weeks 5-6: OCR & Invoice Scanning**
- Set up Google Cloud Vision
- Build invoice upload pipeline
- Add OCR processing
- Extract Skonto terms automatically

### **Weeks 7-8: Forecasting & Alerts**
- Build forecasting algorithm
- Implement predictive alerts
- Add action recommendations
- Test accuracy

### **Weeks 9-10: Supplier Intelligence**
- Create supplier data model
- Build risk scoring
- Add payment history tracking
- Enhance prioritization

### **Weeks 11-12: Polish & Launch**
- User testing
- Bug fixes
- Performance optimization
- Marketing materials
- Official launch

---

**Total Estimated Time to MVP:**
**14 days intensive development** (2 developers) OR **4-6 weeks** (1 developer)

**Priority Level Guide:**
- 🔴 CRITICAL - Must have for launch
- 🟠 HIGH - Important for user satisfaction
- 🟡 MEDIUM - Nice to have, can wait
- 🟢 LOW - Future enhancement
