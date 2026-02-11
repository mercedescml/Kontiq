# Kontiq Test Suite

This directory contains the automated test suite for the Kontiq application.

## Getting Started

### Install Dependencies

```bash
npm install --save-dev jest supertest @testing-library/dom @testing-library/user-event
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/server/auth.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should register"
```

## Test Structure

```
tests/
├── unit/
│   ├── server/          # Backend unit tests
│   │   ├── auth.test.js            # Authentication tests
│   │   ├── permissions.test.js     # (TODO) Authorization tests
│   │   ├── crud-operations.test.js # (TODO) CRUD endpoint tests
│   │   └── data-persistence.test.js # (TODO) File I/O tests
│   └── frontend/        # Frontend unit tests
│       ├── permissions-manager.test.js  # Permissions logic
│       ├── api-client.test.js          # (TODO) API client tests
│       └── modal-manager.test.js       # (TODO) Modal tests
├── integration/         # (TODO) Integration tests
│   └── user-workflows.test.js
├── e2e/                # (TODO) End-to-end tests
│   └── playwright/
└── fixtures/           # (TODO) Test data
    └── sample-data.json
```

## Current Test Coverage

### ✅ Implemented Tests

- **Authentication** (`auth.test.js`)
  - User registration
  - User login
  - Password hashing
  - Role assignment

- **Permissions Manager** (`permissions-manager.test.js`)
  - Role checking
  - Permission validation
  - Entity-level permissions
  - Navigation filtering

### 🚧 Pending Tests

See `docs/TEST_COVERAGE_ANALYSIS.md` for complete list of tests to implement.

Priority areas:
1. **Authorization** - Multi-tenancy security
2. **CRUD Operations** - All resource endpoints
3. **Data Persistence** - File I/O error handling
4. **API Client** - Frontend HTTP logic
5. **Integration Tests** - Complete user workflows

## Writing Tests

### Backend Test Example

```javascript
const request = require('supertest');
const app = require('../../../server');

describe('POST /api/resource', () => {
  test('should create new resource', async () => {
    const res = await request(app)
      .post('/api/resource')
      .send({ name: 'Test' })
      .expect(201);

    expect(res.body.resource).toBeDefined();
    expect(res.body.resource.name).toBe('Test');
  });
});
```

### Frontend Test Example

```javascript
describe('MyClass', () => {
  let instance;

  beforeEach(() => {
    instance = new MyClass();
  });

  test('should do something', () => {
    const result = instance.doSomething();
    expect(result).toBe(true);
  });
});
```

## Test Data Management

Tests use a separate data directory to avoid polluting production data:
- Production data: `data/`
- Test data: `data-test/` (auto-created and cleaned up)

Each test file should:
1. Create test data in `beforeEach()`
2. Clean up test data in `afterEach()`
3. Never touch production data files

## Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| Authentication | 80% | 95% |
| Authorization | 0% | 95% |
| CRUD Operations | 0% | 85% |
| Frontend Logic | 20% | 75% |
| **Overall** | **15%** | **80%** |

## Troubleshooting

### Tests Fail to Run

**Issue**: `Cannot find module 'jest'`
**Solution**: Run `npm install`

**Issue**: `ENOENT: no such file or directory`
**Solution**: Tests create their own data directory. Check file paths.

### Tests Pass Locally but Fail in CI

**Issue**: Different Node.js versions
**Solution**: Ensure CI uses Node.js ≥18 (matches `package.json`)

**Issue**: File system differences (Windows vs Linux)
**Solution**: Use `path.join()` for all file paths

### Coverage Reports Don't Match

**Issue**: Some files not included in coverage
**Solution**: Check `collectCoverageFrom` in `jest.config.js`

## Best Practices

### DO ✅
- Write descriptive test names
- Test one thing per test
- Use `beforeEach()` for setup
- Clean up after tests
- Mock external dependencies
- Test error cases
- Use meaningful assertions

### DON'T ❌
- Test implementation details
- Write interdependent tests
- Leave test data lying around
- Skip edge cases
- Test multiple things in one test
- Use real API calls (mock them)
- Commit test data files

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Library](https://testing-library.com/)
- [Test Coverage Analysis](../docs/TEST_COVERAGE_ANALYSIS.md)

## Contributing

Before submitting a PR:
1. Ensure all tests pass: `npm test`
2. Check coverage: `npm run test:coverage`
3. Add tests for new features
4. Update this README if adding new test categories

## Next Steps

1. Install test dependencies
2. Run existing tests: `npm test`
3. Review failing tests (if any)
4. Read `docs/TEST_COVERAGE_ANALYSIS.md`
5. Implement priority tests (authorization, CRUD)
6. Setup CI/CD pipeline

## Questions?

See `docs/TEST_COVERAGE_ANALYSIS.md` for comprehensive testing strategy and test case examples.
