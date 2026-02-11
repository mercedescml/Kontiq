/**
 * Authentication Tests
 * Tests for user registration and login endpoints
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock the data directory for testing
const TEST_DATA_DIR = path.join(__dirname, '../../../data-test');

describe('Authentication API', () => {
  let app;
  const usersFile = path.join(TEST_DATA_DIR, 'users.json');
  const permissionsFile = path.join(TEST_DATA_DIR, 'permissions.json');

  beforeAll(() => {
    // Create test data directory
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clear test data before each test
    if (fs.existsSync(usersFile)) fs.unlinkSync(usersFile);
    if (fs.existsSync(permissionsFile)) fs.unlinkSync(permissionsFile);

    // Reset modules to get fresh server instance
    jest.resetModules();

    // Mock DATA_DIR to use test directory
    jest.mock('path', () => ({
      ...jest.requireActual('path'),
      join: (...args) => {
        const original = jest.requireActual('path').join(...args);
        if (args[1] === 'data') {
          return TEST_DATA_DIR;
        }
        return original;
      }
    }));

    // Require app after mocking
    app = require('../../../server');
  });

  afterAll(() => {
    // Clean up test data directory
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe('POST /api/users/register', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'Test User',
        company: 'Test GmbH'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.company).toBe('Test GmbH');

      // Password hash should NOT be returned
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });

    test('should return 400 if email is missing', async () => {
      const userData = {
        password: 'SecurePassword123'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(res.body.error).toContain('fehlt');
    });

    test('should return 400 if password is missing', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(res.body.error).toContain('fehlt');
    });

    test('should return 409 if email already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      // Register first time
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Try to register again
      const res = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(409);

      expect(res.body.error).toContain('existiert bereits');
    });

    test('should assign geschaeftsfuehrer role on registration', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'AdminPass123',
        name: 'Admin User',
        company: 'Admin GmbH'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Read permissions file
      const permsData = fs.readFileSync(permissionsFile, 'utf8');
      const perms = JSON.parse(permsData);

      expect(perms.globalPermissions['admin@example.com']).toBeDefined();
      expect(perms.globalPermissions['admin@example.com'].role).toBe('geschaeftsfuehrer');
    });

    test('should assign full permissions on registration', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'AdminPass123'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      const permsData = fs.readFileSync(permissionsFile, 'utf8');
      const perms = JSON.parse(permsData);
      const userPerms = perms.globalPermissions['admin@example.com'].permissions;

      // Check all module permissions
      expect(userPerms.entitaeten.view).toBe(true);
      expect(userPerms.entitaeten.edit).toBe(true);
      expect(userPerms.bankkonten.view).toBe(true);
      expect(userPerms.kosten.edit).toBe(true);
      expect(userPerms.permissions.view).toBe(true);
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
          name: 'Test User',
          company: 'Test GmbH'
        });
    });

    test('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123'
        })
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.company).toBe('Test GmbH');

      // Password should not be returned
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });

    test('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          password: 'TestPassword123'
        })
        .expect(400);

      expect(res.body.error).toContain('fehlt');
    });

    test('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(res.body.error).toContain('fehlt');
    });

    test('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })
        .expect(404);

      expect(res.body.error).toContain('nicht gefunden');
    });

    test('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(res.body.error).toContain('Falsches Passwort');
    });

    test('should be case-sensitive for email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'TestPassword123'
        })
        .expect(404);

      expect(res.body.error).toContain('nicht gefunden');
    });
  });

  describe('Password Security', () => {
    test('should hash passwords before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'PlainTextPassword'
      };

      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      const usersData = fs.readFileSync(usersFile, 'utf8');
      const users = JSON.parse(usersData);
      const user = users.find(u => u.email === 'test@example.com');

      // Password hash should not equal plain text password
      expect(user.passwordHash).not.toBe('PlainTextPassword');

      // Hash should be hex string (SHA-256 produces 64 hex chars)
      expect(user.passwordHash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should produce consistent hashes for same password', async () => {
      const password = 'SamePassword123';

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'user1@example.com',
          password: password
        });

      // Register second user with same password
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'user2@example.com',
          password: password
        });

      const usersData = fs.readFileSync(usersFile, 'utf8');
      const users = JSON.parse(usersData);

      const user1 = users.find(u => u.email === 'user1@example.com');
      const user2 = users.find(u => u.email === 'user2@example.com');

      // WARNING: This test documents a security flaw!
      // SHA-256 without salt produces same hash for same password
      // This makes the system vulnerable to rainbow table attacks
      expect(user1.passwordHash).toBe(user2.passwordHash);

      // TODO: Replace SHA-256 with bcrypt which includes salt
    });
  });
});
