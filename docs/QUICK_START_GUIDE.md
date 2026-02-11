# KONTIQ QUICK START GUIDE
## Get Started in 30 Minutes

This guide will help you set up your development environment and understand the implementation roadmap.

---

## 📚 WHAT YOU NEED TO READ

**Start Here:**
1. **PRODUCT_AUDIT.md** - Full audit of current vs. target state (if you want complete context)
2. **PRODUCTION_ARCHITECTURE.md** - Technical architecture and design decisions
3. **IMPLEMENTATION_TASKLIST.md** - Step-by-step implementation guide ⭐ **START HERE**

---

## 🎯 CURRENT STATE

**What Works:**
- ✅ User registration & login (bcrypt password hashing)
- ✅ Dashboard with KPI widgets
- ✅ Payment management UI
- ✅ Invoice/receivables tracking
- ✅ Multi-entity support
- ✅ Hierarchical permissions
- ✅ Contract management
- ✅ Cost tracking
- ✅ Bank account management
- ✅ Comprehensive onboarding wizard

**What's Missing (Critical):**
- ❌ Database: Currently uses JSON files (need PostgreSQL)
- ❌ Dashboard shows zeros (bug - data not connected)
- ❌ PDF/Excel export returns fake URLs
- ❌ No banking API integration (FinAPI planned)
- ❌ No DATEV/accounting integration
- ❌ No email notifications
- ❌ No authentication on API endpoints
- ❌ No Skonto capture rate tracking
- ❌ No predictive forecasting

**Completion Status:**
- Code: ~80-85% complete
- Production-ready features: ~20%
- Time to MVP: 4-6 weeks (1 developer)

---

## 🚀 FASTEST PATH TO WORKING MVP

### **WEEK 1: Foundation (Days 1-7)**

**Day 1: Environment Setup**
```bash
# Install dependencies
brew install postgresql@14 redis  # macOS
brew services start postgresql@14
brew services start redis

# OR on Linux
sudo apt install postgresql redis-server

# Create database
createdb kontiq_dev

# Install Node packages
npm install pg sequelize redis bull jsonwebtoken express-rate-limit winston pdfkit exceljs @sendgrid/mail

# Set up environment
cp .env.example .env
# Edit .env with your credentials
```

**Days 2-3: Database Migration**
```bash
# Initialize Sequelize
npx sequelize-cli init

# Create models (copy from IMPLEMENTATION_TASKLIST.md)
# Run migrations
npx sequelize-cli db:migrate

# Migrate JSON data to PostgreSQL
node scripts/migrate-json-to-postgres.js
```

**Days 4-5: Security & Authentication**
- Implement JWT authentication
- Protect API endpoints
- Add rate limiting
- Input validation

**Days 6-7: Fix Critical Bugs**
- Fix dashboard zero-data bug (EASY WIN!)
- Implement real PDF/Excel export
- Add Skonto capture rate tracking

### **WEEK 2: Integrations (Days 8-14)**

**Days 8-9: Email Notifications**
- Set up SendGrid
- Create email templates
- Build alert system

**Days 10-12: Banking Integration Prep**
- Sign up for FinAPI sandbox
- Implement connection flow
- Test with sandbox accounts

**Days 13-14: Testing & Deploy**
- Write API tests
- Set up Docker
- Deploy to Railway/Render

---

## 💻 RUNNING THE APPLICATION

### **Current Setup (JSON-based)**
```bash
# Start server
npm start

# Or with auto-reload
npm run dev

# Access application
http://localhost:3000
```

### **After Database Migration**
```bash
# Start PostgreSQL and Redis
brew services start postgresql@14
brew services start redis

# Run migrations
npx sequelize-cli db:migrate

# Start server
npm start

# Start background worker (for email alerts)
node jobs/scheduler.js
```

### **With Docker (Production-like)**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## 📁 PROJECT STRUCTURE

```
/home/user/Kontiq/
├── server.js                    # Main Express server (681 lines)
├── package.json                 # Dependencies
├── data/                        # JSON data storage (temporary)
│   ├── users.json
│   ├── zahlungen.json
│   ├── forderungen.json
│   └── ... (other data files)
├── models/                      # Database models (NEW - after migration)
│   ├── company.js
│   ├── user.js
│   ├── payment.js
│   └── ... (other models)
├── services/                    # Business logic (NEW)
│   ├── skonto-service.js
│   ├── email-service.js
│   ├── finapi-service.js
│   └── ... (other services)
├── middleware/                  # Express middleware (NEW)
│   ├── auth.js
│   ├── rate-limit.js
│   └── validate.js
├── jobs/                        # Background jobs (NEW)
│   ├── alert-checker.js
│   └── scheduler.js
├── public/                      # Frontend
│   ├── index.html               # Main SPA shell
│   ├── landing.html             # Landing page
│   ├── onboarding.html          # Onboarding wizard
│   ├── views/                   # Application pages
│   │   ├── dashboard.html
│   │   ├── zahlungen.html
│   │   ├── forderungen.html
│   │   └── ... (13 total views)
│   ├── js/                      # Frontend logic
│   │   ├── app.js
│   │   ├── dashboard.js
│   │   ├── zahlungen.js
│   │   └── ... (23 total modules)
│   └── css/
│       └── global-harmonized.css
├── docs/                        # Documentation
│   ├── PRODUCTION_ARCHITECTURE.md    # Technical architecture ⭐
│   ├── IMPLEMENTATION_TASKLIST.md    # Step-by-step guide ⭐
│   ├── QUICK_START_GUIDE.md          # This file
│   └── ... (19 total doc files)
└── tests/                       # Test suite
    └── api.test.js
```

---

## 🔑 KEY CONCEPTS

### **Current Architecture (JSON-based)**
- Data stored in JSON files (`/data/*.json`)
- No database, no transactions
- Simple file system read/write
- Works for demo, NOT production

### **Target Architecture (PostgreSQL)**
- PostgreSQL for all data
- Redis for caching and sessions
- Bull for background jobs
- JWT for authentication
- FinAPI for banking
- DATEV for accounting

### **Data Migration Strategy**
1. **Phase 1:** Dual-write (write to both JSON and PostgreSQL)
2. **Phase 2:** Migrate existing JSON data to PostgreSQL
3. **Phase 3:** Read from PostgreSQL
4. **Phase 4:** Remove JSON files

---

## 🎓 LEARNING RESOURCES

### **Technologies Used**
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL + Sequelize ORM
- **Caching:** Redis
- **Jobs:** Bull Queue
- **Frontend:** Vanilla JavaScript (no framework)
- **Charts:** Chart.js
- **Auth:** JWT (jsonwebtoken)
- **Email:** SendGrid
- **Banking:** FinAPI
- **Accounting:** DATEV Connect API

### **German SME Context**
- **Skonto:** Early payment discount (e.g., "2% within 10 days")
- **DATEV:** Market-leading accounting software in Germany
- **Umsatzsteuervoranmeldung:** VAT pre-registration (quarterly/monthly)
- **Steuerberater:** Tax advisor (key distribution channel)
- **Handwerk:** Trades/craftsmen (construction, plumbing, etc.)

---

## 🐛 KNOWN ISSUES & FIXES

### **Issue 1: Dashboard shows zeros**
**Fix:** See IMPLEMENTATION_TASKLIST.md > TASK 3.1

### **Issue 2: PDF export returns fake URL**
**Fix:** See IMPLEMENTATION_TASKLIST.md > TASK 3.2

### **Issue 3: No authentication on API endpoints**
**Fix:** See IMPLEMENTATION_TASKLIST.md > TASK 2.1

### **Issue 4: Large HTML files (>90K lines)**
**Not urgent:** Consider splitting or using a framework in future refactor

---

## 📊 FEATURE PRIORITY

### **🔴 MUST HAVE (Week 1-2)**
1. PostgreSQL migration
2. JWT authentication
3. Fix dashboard bug
4. Real PDF/Excel export
5. Skonto capture rate tracking
6. Email notifications

### **🟠 SHOULD HAVE (Week 3-4)**
7. FinAPI banking integration
8. DATEV CSV import
9. Supplier data model
10. Basic forecasting

### **🟡 NICE TO HAVE (Week 5+)**
11. OCR invoice scanning
12. ML-based forecasting
13. Stress testing
14. Autopilot mode
15. Mobile app

---

## 🤝 GETTING HELP

### **Documentation**
- Full Product Audit: `docs/PRODUCT_AUDIT.md`
- Architecture Design: `docs/PRODUCTION_ARCHITECTURE.md`
- Implementation Guide: `docs/IMPLEMENTATION_TASKLIST.md` ⭐

### **Code Comments**
- Most critical sections have inline comments
- Check `server.js` for API endpoint documentation
- Frontend JavaScript files have function-level comments

### **External Resources**
- Sequelize Docs: https://sequelize.org/docs/
- FinAPI Docs: https://docs.finapi.io/
- PostgreSQL Tutorial: https://www.postgresql.org/docs/
- DATEV API: https://developer.datev.de/

---

## ✅ VERIFICATION CHECKLIST

Before you start development, verify:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed (`psql --version`)
- [ ] Redis installed (`redis-cli --version`)
- [ ] Can create database (`createdb kontiq_dev`)
- [ ] Can connect to Redis (`redis-cli ping`)
- [ ] Environment file created (`.env`)
- [ ] Dependencies installed (`npm install`)

After database migration, verify:

- [ ] All tables created (`psql -d kontiq_dev -c "\dt"`)
- [ ] Sample data exists (`SELECT COUNT(*) FROM users;`)
- [ ] Server starts without errors (`npm start`)
- [ ] Can login and get JWT token
- [ ] Dashboard shows real data (not zeros)

---

## 🎯 SUCCESS METRICS

**Technical:**
- All tests passing
- API response time < 200ms
- No errors in production logs
- 99.5% uptime

**Business:**
- Users capture >70% of available Skonto
- Average €5,000-15,000 saved per year per user
- Cash flow forecasts 90%+ accurate
- Users log in 3-5x per week

---

## 🚀 DEPLOYMENT

### **Option 1: Railway.app (Recommended)**
```bash
npm i -g @railway/cli
railway login
railway init
railway add --plugin postgresql
railway add --plugin redis
railway up
```

### **Option 2: Render.com**
- Connect GitHub repo
- Add `render.yaml` (see IMPLEMENTATION_TASKLIST.md)
- Auto-deploy on push

### **Option 3: Docker + VPS**
```bash
docker-compose build
docker-compose up -d
```

---

## 📞 NEXT STEPS

1. **Read IMPLEMENTATION_TASKLIST.md** - Detailed step-by-step guide
2. **Set up your environment** - PostgreSQL, Redis, Node.js
3. **Start with Day 1 tasks** - Database setup
4. **Follow the 14-day plan** - Get to MVP

**Estimated Time:**
- Following this guide: **4-6 weeks** (1 developer)
- With 2 developers: **2-3 weeks**
- Intensive sprint: **14 days** (2 developers, full-time)

---

Good luck! 🎉

For questions or issues, check the detailed documentation in `/docs/`.
