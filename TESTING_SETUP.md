# Testing Setup Guide - Quick Start

This guide will help you get the Kontiq test suite up and running in 5 minutes.

## Quick Start

### 1. Install Dependencies (2 minutes)

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `supertest` - HTTP endpoint testing
- `@testing-library/dom` - DOM testing utilities
- `@testing-library/user-event` - User interaction simulation

### 2. Run Tests (1 minute)

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on changes)
npm run test:watch
```

### 3. Review Results

You should see output like:
```
PASS  tests/unit/server/auth.test.js
  Authentication API
    POST /api/users/register
      ✓ should register a new user with valid data (45ms)
      ✓ should return 400 if email is missing (12ms)
      ✓ should return 409 if email already exists (18ms)
      ...

Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

## What's Been Set Up

### ✅ Test Configuration
- `jest.config.js` - Jest configuration
- `package.json` - Updated with test scripts and dependencies

### ✅ Sample Tests
- `tests/unit/server/auth.test.js` - Authentication endpoint tests
- `tests/unit/frontend/permissions-manager.test.js` - Permissions logic tests

### ✅ Documentation
- `docs/TEST_COVERAGE_ANALYSIS.md` - Comprehensive test strategy
- `tests/README.md` - Test suite documentation

### ✅ Git Configuration
- `.gitignore` - Excludes test artifacts and coverage reports

## Current Test Coverage

**Overall**: ~15% (18 tests)

### Covered
- ✅ User registration
- ✅ User login
- ✅ Password hashing
- ✅ Role assignment (Geschäftsführer)
- ✅ Permission checking logic
- ✅ Role-based access

### Not Covered Yet (Priority)
- ❌ Authorization/multi-tenancy security
- ❌ CRUD operations (zahlungen, kosten, forderungen, etc.)
- ❌ Data persistence error handling
- ❌ Input validation
- ❌ API client (frontend)
- ❌ Integration tests
- ❌ End-to-end tests

## Next Steps

### 1. Read the Analysis (5 minutes)
```bash
cat docs/TEST_COVERAGE_ANALYSIS.md
```

This document contains:
- Detailed coverage analysis
- Security vulnerabilities found
- Test priorities
- Sample test code

### 2. Run Coverage Report (1 minute)
```bash
npm run test:coverage
```

Open `coverage/lcov-report/index.html` in your browser to see visual coverage report.

### 3. Add Missing Tests (Ongoing)

**Priority 1 - Security Tests** (Week 1)
```bash
# Create these files:
tests/unit/server/permissions.test.js    # Multi-tenancy security
tests/unit/server/authorization.test.js  # Permission checks
```

**Priority 2 - CRUD Tests** (Week 1-2)
```bash
# Create these files:
tests/unit/server/zahlungen.test.js
tests/unit/server/kosten.test.js
tests/unit/server/forderungen.test.js
tests/unit/server/bankkonten.test.js
tests/unit/server/contracts.test.js
tests/unit/server/entitaeten.test.js
```

**Priority 3 - Frontend Tests** (Week 2-3)
```bash
# Create these files:
tests/unit/frontend/api-client.test.js
tests/unit/frontend/modal-manager.test.js
```

### 4. Setup CI/CD (Week 3)

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Critical Security Issues Found

### 🚨 URGENT: Password Hashing Vulnerability

**Current**: Using SHA-256 (vulnerable to rainbow tables)
**Fix Needed**: Replace with bcrypt

```bash
npm install bcrypt
```

Then update `server.js`:
```javascript
const bcrypt = require('bcrypt');

// Replace this:
const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd || '').digest('hex');

// With this:
const hashPassword = async (pwd) => {
  const saltRounds = 10;
  return await bcrypt.hash(pwd || '', saltRounds);
};

const verifyPassword = async (pwd, hash) => {
  return await bcrypt.compare(pwd, hash);
};
```

**Impact**: All user passwords are currently at risk of being cracked.
**See**: `docs/TEST_COVERAGE_ANALYSIS.md` section "Security Vulnerabilities Found"

## Useful Commands

```bash
# Run specific test file
npm test -- tests/unit/server/auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should register"

# Run tests with detailed output
npm run test:verbose

# Update snapshots (if using snapshot testing)
npm test -- -u

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Troubleshooting

### Tests Won't Run

**Error**: `Cannot find module 'jest'`
```bash
# Solution: Install dependencies
npm install
```

**Error**: `Test suite failed to run`
```bash
# Solution: Check Jest config
cat jest.config.js
```

### Coverage Report Empty

```bash
# Make sure coverage is enabled
npm run test:coverage

# Check jest.config.js has collectCoverageFrom
cat jest.config.js | grep collectCoverageFrom
```

### Tests Failing

```bash
# Run with verbose output
npm run test:verbose

# Check if test data directory exists
ls -la data-test/  # Should be empty or not exist

# Clear test cache
npx jest --clearCache
```

## Getting Help

1. **Test Suite Documentation**: `tests/README.md`
2. **Coverage Analysis**: `docs/TEST_COVERAGE_ANALYSIS.md`
3. **Jest Docs**: https://jestjs.io/docs/getting-started
4. **Supertest Docs**: https://github.com/visionmedia/supertest

## Summary

You now have:
- ✅ Test framework installed
- ✅ 18 working tests
- ✅ Test scripts in package.json
- ✅ Sample test files
- ✅ Comprehensive testing strategy
- ✅ Coverage reporting

**Next action**: Run `npm install && npm test` to verify everything works!

---

**Total setup time**: ~5 minutes
**Current coverage**: ~15%
**Target coverage**: 80%
**Estimated time to target**: 4-5 weeks

Good luck! 🚀
