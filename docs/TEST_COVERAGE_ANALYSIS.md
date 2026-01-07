# Test Coverage Analysis - Kontiq

**Date**: 2026-01-07
**Status**: ⚠️ **CRITICAL - NO AUTOMATED TESTS**

## Executive Summary

The Kontiq codebase currently has **0% automated test coverage**. All testing is manual, which creates significant risks for:
- Regression bugs when adding features
- Deployment confidence
- Code refactoring safety
- Business logic validation
- Security vulnerabilities

## Current Testing State

### ✅ What Exists
- Manual testing procedures documented in `TEST_GUIDE.md`
- Manual UI testing checklist
- File verification script (`check-improvements.sh`)

### ❌ What's Missing
- No testing framework (Jest, Mocha, Vitest, etc.)
- No unit tests
- No integration tests
- No end-to-end tests
- No test coverage reports
- No CI/CD testing pipeline
- No automated regression testing

## Critical Areas Requiring Tests

### 🔴 **Priority 1: Security & Authentication** (CRITICAL)

#### 1.1 Password Security (`server.js:41`)
**Current Risk**: SHA-256 is NOT secure for password hashing (vulnerable to rainbow tables)

**Tests Needed**:
```javascript
// server.js - hashPassword function
- Test password hashing produces consistent outputs
- Test empty password handling
- Test special characters in passwords
- Test very long passwords (DOS protection)
- SECURITY FIX NEEDED: Replace SHA-256 with bcrypt
```

**Impact**: 🔴 **CRITICAL** - User credentials at risk

#### 1.2 Authentication Endpoints
**Endpoints**: `/api/users/register`, `/api/users/login`

**Tests Needed**:
- Registration with valid credentials
- Registration with duplicate email (should fail)
- Registration with missing fields
- Login with correct credentials
- Login with wrong password
- Login with non-existent user
- SQL injection attempts in email/password
- XSS injection attempts
- Rate limiting (prevent brute force)

**Current Gap**: No validation tests, no security tests

#### 1.3 Session Management
**Tests Needed**:
- Test localStorage user data handling
- Test session expiration
- Test concurrent sessions
- Test user data isolation

### 🔴 **Priority 2: Authorization & Permissions** (CRITICAL)

#### 2.1 Permission System (`server.js:349-443`, `permissions.js`)
**Tests Needed**:
- Geschäftsführer has full access to all modules
- Employee can only access permitted modules
- Entity-level permissions work correctly
- Permission denial for unauthorized actions
- User can only see data from their company (multi-tenancy)

**Critical Security Tests**:
```javascript
// Test company isolation
- User from Company A cannot access Company B's data
- GET /api/entitaeten?email=userA returns only their entities
- GET /api/permissions/all filters by company correctly
```

**Current Gap**: No authorization tests - **MAJOR SECURITY RISK**

#### 2.2 Role-Based Access Control
**Tests Needed**:
- Only Geschäftsführer can invite users (`POST /api/users/invite`)
- Only Geschäftsführer can modify global permissions
- Entity managers can manage their entities
- Permission checks work on all protected endpoints

### 🟠 **Priority 3: Business Logic** (HIGH)

#### 3.1 Data Persistence (`server.js:15-25`)
**Functions**: `readJSON()`, `writeJSON()`

**Tests Needed**:
- Read existing JSON file
- Read non-existent file (returns default)
- Read corrupted JSON file (error handling)
- Write valid data
- Write fails when disk full
- Concurrent write operations (race conditions)
- File permissions errors

**Current Gap**: No tests for file operations - **DATA LOSS RISK**

#### 3.2 CRUD Operations
**All Endpoints**: zahlungen, kosten, forderungen, bankkonten, contracts, entitaeten

**Tests Needed for Each Resource**:
```javascript
GET /api/{resource}
- Returns all items
- Filters by userId correctly
- Returns empty array when no data

POST /api/{resource}
- Creates item with valid data
- Generates unique ID
- Adds userId and timestamp
- Rejects invalid data
- Returns 400 for missing required fields

PUT /api/{resource}/:id
- Updates existing item
- Returns 404 for non-existent ID
- Preserves ID (cannot change)
- Merges data correctly

DELETE /api/{resource}/:id
- Deletes existing item
- Returns success for non-existent ID (idempotent)
- Cascades deletion (e.g., entity permissions)
```

**Current Gap**: No validation tests for any CRUD operations

#### 3.3 Entity Management (`server.js:295-346`)
**Critical Tests**:
- Entity creation with managers
- Entity filtering by user company
- Geschäftsführer sees all company entities
- Employee sees only their assigned entities
- Entity deletion removes entity permissions

#### 3.4 Categories (`server.js:204-217`)
**Tests Needed**:
- Add new category
- Prevent duplicate categories (returns 409)
- Delete category
- Validate category name (prevent empty/XSS)

### 🟡 **Priority 4: API Client & Frontend** (MEDIUM)

#### 4.1 API Client (`api-client.js`)
**Tests Needed**:
- Request method handles GET/POST/PUT/DELETE
- Adds userId automatically when `withUser=true`
- Handles network errors gracefully
- Parses error responses correctly
- Timeout handling

#### 4.2 Permissions Manager (`permissions.js`)
**Tests Needed**:
- Load permissions from localStorage
- `can()` method returns correct boolean
- `canView()`, `canEdit()`, `canDelete()` work
- `isGeschaeftsfuehrer()` identifies admin correctly
- `getViewableModules()` filters correctly
- `applyToUI()` hides/disables correct elements

#### 4.3 Modal Manager (`modal-manager.js`)
**Tests Needed**:
- Open modal sets display and adds class
- Close modal removes class
- ESC key closes modal
- Click on overlay closes modal
- Multiple modals stack correctly

#### 4.4 App Navigation (`app.js`)
**Tests Needed**:
- User loads from localStorage
- View caching works
- Navigation switches views correctly
- Preloading doesn't block UI

### 🟢 **Priority 5: Edge Cases** (LOW-MEDIUM)

#### 5.1 Input Validation
**Tests Needed**:
- Very long strings (DOS protection)
- Special characters
- Unicode characters
- Empty strings
- Null/undefined values
- Type coercion attacks

#### 5.2 Sample Data
**Tests Needed** (`server.js:43-46`):
- Sample contracts are created on first GET
- Sample data has correct structure

#### 5.3 Onboarding (`server.js:220-233`)
**Tests Needed**:
- Save onboarding data by email
- Retrieve onboarding data
- Missing email returns 400

## Security Vulnerabilities Found

### 🚨 **CRITICAL Issues**

1. **Weak Password Hashing** (`server.js:41`)
   - Using SHA-256 instead of bcrypt/argon2
   - No salt, vulnerable to rainbow tables
   - **FIX**: Replace with bcrypt with salt rounds ≥10

2. **No Input Validation**
   - No email format validation
   - No XSS sanitization
   - No SQL/NoSQL injection protection
   - **FIX**: Add input validation library (joi, validator.js)

3. **No Rate Limiting**
   - Login endpoint vulnerable to brute force
   - Registration endpoint vulnerable to spam
   - **FIX**: Add express-rate-limit

4. **No CSRF Protection**
   - State-changing operations have no CSRF tokens
   - **FIX**: Add csurf middleware

5. **Error Messages Leak Information**
   - "Benutzer existiert bereits" reveals registered emails
   - "Benutzer nicht gefunden" vs "Falsches Passwort" enables user enumeration
   - **FIX**: Use generic error messages

### ⚠️ **HIGH Issues**

6. **No Authorization Middleware**
   - Every endpoint manually checks permissions
   - Easy to forget checks
   - **FIX**: Create middleware for auth/authz

7. **Permissions Not Verified on All Endpoints**
   - Some endpoints missing permission checks
   - **FIX**: Audit all endpoints

8. **No Request Body Validation**
   - Missing validation allows arbitrary fields
   - **FIX**: Use express-validator

## Recommended Testing Strategy

### Phase 1: Backend Unit Tests (Week 1-2)

**Setup**:
```bash
npm install --save-dev jest supertest
```

**Priority Order**:
1. Authentication tests (register, login)
2. Authorization tests (permissions system)
3. Data persistence tests (readJSON, writeJSON)
4. CRUD operation tests for each resource
5. Input validation tests

**Target**: 80% backend code coverage

### Phase 2: Frontend Unit Tests (Week 2-3)

**Setup**:
```bash
npm install --save-dev jest @testing-library/dom @testing-library/user-event
```

**Priority Order**:
1. API client tests
2. Permissions manager tests
3. Modal manager tests
4. Business logic modules

**Target**: 70% frontend code coverage

### Phase 3: Integration Tests (Week 3-4)

**Setup**:
```bash
npm install --save-dev jest supertest
```

**Tests**:
- Complete user workflows (register → login → create entity → add payment)
- Multi-user scenarios
- Permission inheritance
- Data consistency

**Target**: All critical user flows covered

### Phase 4: E2E Tests (Week 4-5)

**Setup**:
```bash
npm install --save-dev playwright
```

**Tests**:
- Complete user journeys in real browser
- Form submissions
- Modal interactions
- Navigation flows

**Target**: 10 critical user paths

### Phase 5: CI/CD Integration (Week 5)

**Setup**:
- GitHub Actions workflow
- Automatic test runs on PR
- Coverage reporting
- Deployment only if tests pass

## Specific Test File Structure Proposal

```
kontiq/
├── tests/
│   ├── unit/
│   │   ├── server/
│   │   │   ├── auth.test.js
│   │   │   ├── permissions.test.js
│   │   │   ├── data-persistence.test.js
│   │   │   ├── zahlungen.test.js
│   │   │   ├── kosten.test.js
│   │   │   ├── forderungen.test.js
│   │   │   ├── bankkonten.test.js
│   │   │   ├── contracts.test.js
│   │   │   ├── entitaeten.test.js
│   │   │   └── categories.test.js
│   │   └── frontend/
│   │       ├── api-client.test.js
│   │       ├── permissions-manager.test.js
│   │       ├── modal-manager.test.js
│   │       └── app.test.js
│   ├── integration/
│   │   ├── user-workflows.test.js
│   │   ├── multi-tenancy.test.js
│   │   └── permissions-integration.test.js
│   ├── e2e/
│   │   ├── registration-login.spec.js
│   │   ├── entity-management.spec.js
│   │   └── payment-flow.spec.js
│   └── fixtures/
│       ├── sample-users.json
│       ├── sample-entities.json
│       └── sample-permissions.json
├── jest.config.js
└── playwright.config.js
```

## Sample Test Examples

### Example 1: Authentication Test

```javascript
// tests/unit/server/auth.test.js
const request = require('supertest');
const app = require('../../../server');
const fs = require('fs');
const path = require('path');

describe('POST /api/users/register', () => {
  const testDataDir = path.join(__dirname, '../../../data-test');

  beforeEach(() => {
    // Clean test data
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
  });

  test('should register new user with valid data', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
        company: 'Test GmbH'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  test('should reject duplicate email', async () => {
    // Register first user
    await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'Pass123'
      });

    // Try to register again
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'Pass456'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('existiert bereits');
  });

  test('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ password: 'Pass123' });

    expect(res.status).toBe(400);
  });

  test('should assign geschaeftsfuehrer role on registration', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: 'admin@example.com',
        password: 'Admin123'
      });

    expect(res.status).toBe(201);

    // Check permissions file
    const perms = JSON.parse(
      fs.readFileSync(path.join(testDataDir, 'permissions.json'), 'utf8')
    );
    expect(perms.globalPermissions['admin@example.com'].role).toBe('geschaeftsfuehrer');
  });
});
```

### Example 2: Permissions Test

```javascript
// tests/unit/server/permissions.test.js
describe('GET /api/permissions/user/:email', () => {
  test('should return user permissions', async () => {
    // Setup: Create user with permissions
    await createTestUser('user@test.com', 'geschaeftsfuehrer');

    const res = await request(app)
      .get('/api/permissions/user/user@test.com');

    expect(res.status).toBe(200);
    expect(res.body.permissions.global.role).toBe('geschaeftsfuehrer');
  });

  test('should include entity permissions', async () => {
    await createTestUser('user@test.com', 'employee');
    await assignEntityPermission('entity-1', 'user@test.com', {
      bankkonten: { view: true, edit: false }
    });

    const res = await request(app)
      .get('/api/permissions/user/user@test.com');

    expect(res.body.permissions.entities['entity-1']).toBeDefined();
  });
});

describe('Multi-tenancy Security', () => {
  test('should not return other company users', async () => {
    // Company A
    await createTestUser('admin-a@companyA.com', 'geschaeftsfuehrer', 'Company A');

    // Company B
    await createTestUser('admin-b@companyB.com', 'geschaeftsfuehrer', 'Company B');

    const res = await request(app)
      .get('/api/permissions/all?email=admin-a@companyA.com');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].email).toBe('admin-a@companyA.com');
  });
});
```

### Example 3: Frontend Permission Manager Test

```javascript
// tests/unit/frontend/permissions-manager.test.js
describe('PermissionsManager', () => {
  let manager;

  beforeEach(() => {
    manager = new PermissionsManager();
    localStorage.clear();
  });

  test('isGeschaeftsfuehrer returns true for admin', () => {
    manager.permissions = {
      global: { role: 'geschaeftsfuehrer' }
    };

    expect(manager.isGeschaeftsfuehrer()).toBe(true);
  });

  test('can() returns true for geschaeftsfuehrer on all modules', () => {
    manager.permissions = {
      global: { role: 'geschaeftsfuehrer' }
    };

    expect(manager.can('bankkonten', 'view')).toBe(true);
    expect(manager.can('kosten', 'edit')).toBe(true);
    expect(manager.can('forderungen', 'delete')).toBe(true);
  });

  test('can() checks entity permissions correctly', () => {
    manager.permissions = {
      global: { role: 'employee' },
      entities: {
        'entity-1': {
          permissions: {
            bankkonten: { view: true, edit: false }
          }
        }
      }
    };

    expect(manager.can('bankkonten', 'view', 'entity-1')).toBe(true);
    expect(manager.can('bankkonten', 'edit', 'entity-1')).toBe(false);
  });
});
```

## Metrics & Coverage Goals

### Target Coverage by Component

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Authentication | 95% | Critical |
| Authorization | 95% | Critical |
| Data Persistence | 90% | High |
| CRUD Operations | 85% | High |
| API Client | 80% | Medium |
| Frontend Logic | 75% | Medium |
| UI Helpers | 60% | Low |

### Overall Target
- **Phase 1 (Backend)**: 80% line coverage
- **Phase 2 (Frontend)**: 70% line coverage
- **Phase 3 (Integration)**: All critical flows
- **Phase 4 (E2E)**: 10 user journeys

## Tools & Libraries Recommended

### Testing Frameworks
- **Jest**: Unit & integration tests (backend + frontend)
- **Supertest**: HTTP endpoint testing
- **Playwright**: E2E browser testing

### Additional Libraries
- **@testing-library/dom**: DOM testing utilities
- **@testing-library/user-event**: User interaction simulation
- **jest-localstorage-mock**: Mock localStorage
- **msw**: Mock Service Worker for API mocking
- **faker-js**: Generate test data

### Quality Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **lint-staged**: Run linters on staged files

### Coverage & Reporting
- **Istanbul/NYC**: Coverage reporting
- **Codecov**: Coverage visualization
- **GitHub Actions**: CI/CD pipeline

## Next Steps

### Immediate Actions (This Week)

1. **Install Jest & Supertest**
   ```bash
   npm install --save-dev jest supertest @types/jest
   ```

2. **Create Basic Test Structure**
   - Create `tests/` directory
   - Add `jest.config.js`
   - Write first authentication test

3. **Fix Critical Security Issue**
   - Replace SHA-256 with bcrypt for password hashing
   - Write tests for new implementation

4. **Add Test Script to package.json**
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage"
   }
   ```

### Short Term (Next 2 Weeks)

5. **Write Backend Unit Tests**
   - Authentication (register, login)
   - Authorization (permissions)
   - CRUD operations for all resources

6. **Setup CI/CD**
   - GitHub Actions workflow
   - Run tests on every PR
   - Block merge if tests fail

### Medium Term (Next Month)

7. **Frontend Tests**
   - API client
   - Permissions manager
   - Modal manager

8. **Integration Tests**
   - User workflows
   - Multi-tenancy
   - Permission inheritance

### Long Term (Next Quarter)

9. **E2E Tests**
   - Critical user journeys
   - Cross-browser testing

10. **Performance Tests**
    - Load testing
    - Stress testing
    - File I/O performance

## Conclusion

The Kontiq application has **0% automated test coverage**, which is a significant risk. The codebase handles sensitive financial data and multi-tenant permissions, making testing absolutely critical.

**Recommended immediate action**:
1. Fix the critical password hashing vulnerability
2. Install Jest and write authentication tests
3. Setup CI/CD to prevent untested code from being deployed

**Estimated effort**:
- Phase 1 (Backend tests): 2 weeks
- Phase 2 (Frontend tests): 1 week
- Phase 3 (Integration tests): 1 week
- Phase 4 (E2E tests): 1 week
- **Total**: 5 weeks for comprehensive coverage

**ROI**: Prevents production bugs, enables confident refactoring, protects sensitive financial data, and ensures business logic correctness.
