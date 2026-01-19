const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== DATA HELPERS ==========
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const readJSON = (file) => {
  try {
    if (!fs.existsSync(file)) return file.includes('permissions') ? { globalPermissions: {}, entityPermissions: {}, invitations: [] } : (file.includes('onboarding') ? {} : []);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) { return file.includes('permissions') ? { globalPermissions: {}, entityPermissions: {}, invitations: [] } : (file.includes('onboarding') ? {} : []); }
};

const writeJSON = (file, data) => {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); return true; }
  catch (e) { return false; }
};

const FILES = {
  categories: path.join(DATA_DIR, 'categories.json'),
  forderungenKategorien: path.join(DATA_DIR, 'forderungen_kategorien.json'),
  zahlungenKategorien: path.join(DATA_DIR, 'zahlungen_kategorien.json'),
  users: path.join(DATA_DIR, 'users.json'),
  onboarding: path.join(DATA_DIR, 'onboarding.json'),
  permissions: path.join(DATA_DIR, 'permissions.json'),
  entitaeten: path.join(DATA_DIR, 'entitaeten.json'),
  contracts: path.join(DATA_DIR, 'contracts.json'),
  zahlungen: path.join(DATA_DIR, 'zahlungen.json'),
  kosten: path.join(DATA_DIR, 'kosten.json'),
  forderungen: path.join(DATA_DIR, 'forderungen.json'),
  bankkonten: path.join(DATA_DIR, 'bankkonten.json'),
  bookings: path.join(DATA_DIR, 'bookings.json')
};

// ========== PASSWORD HASHING WITH BCRYPT ==========
const SALT_ROUNDS = 10; // bcrypt salt rounds for password hashing

// ========== VALIDATION SCHEMAS ==========
const schemas = {
  user: Joi.object({
    email: Joi.string().email().max(255).required().messages({
      'string.email': 'Ungültige E-Mail-Adresse',
      'any.required': 'E-Mail ist erforderlich'
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Passwort muss mindestens 8 Zeichen lang sein',
      'any.required': 'Passwort ist erforderlich'
    }),
    name: Joi.string().max(255).optional().allow(''),
    company: Joi.string().max(255).optional().allow('')
  }),

  transaction: Joi.object({
    amount: Joi.number().positive().max(999999999).required().messages({
      'number.positive': 'Betrag muss positiv sein',
      'any.required': 'Betrag ist erforderlich'
    }),
    category: Joi.string().max(100).optional().allow(''),
    description: Joi.string().max(500).optional().allow(''),
    date: Joi.date().optional(),
    status: Joi.string().max(50).optional().allow(''),
    userId: Joi.string().optional().allow('')
  }),

  entity: Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
      'any.required': 'Name ist erforderlich'
    }),
    type: Joi.string().max(100).optional().allow(''),
    category: Joi.string().max(50).optional().allow(''),
    manager: Joi.string().email().optional().allow(''),
    managers: Joi.array().items(Joi.string().email()).optional(),
    address: Joi.string().max(500).optional().allow(''),
    taxId: Joi.string().max(100).optional().allow(''),
    currency: Joi.string().length(3).optional().allow(''),
    fiscalYear: Joi.string().max(50).optional().allow(''),
    notes: Joi.string().max(1000).optional().allow('')
  }),

  contract: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    partner: Joi.string().max(255).optional().allow(''),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    amount: Joi.number().optional(),
    status: Joi.string().max(50).optional().allow(''),
    userId: Joi.string().optional().allow('')
  }),

  category: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'any.required': 'Kategoriename ist erforderlich'
    })
  })
};

// Validation middleware factory
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return all errors, not just first
    stripUnknown: true // Remove unknown fields
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      error: 'Validierung fehlgeschlagen',
      details: errors
    });
  }

  // Replace req.body with validated/sanitized value
  req.body = value;
  next();
};

const SAMPLE_CONTRACTS = [
  { id: 'sample-1', name: 'Mietvertrag Bürofläche', partner: 'Immobilien Schmidt GmbH', startDate: '2024-01-01', endDate: '2026-12-31', amount: 2500, status: 'active' },
  { id: 'sample-2', name: 'Software-Lizenz Microsoft 365', partner: 'Microsoft Deutschland GmbH', startDate: '2024-03-01', endDate: '2027-02-28', amount: 5400, status: 'active' }
];

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.path.endsWith('.html')) res.set('Cache-Control', 'public, max-age=3600');
  else if (req.path.match(/\.(css|js|png|jpg|svg|woff2?)$/)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
  else if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-cache');
  next();
});

// Landing page at root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));

// Application at /app
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use(express.static('public', { maxAge: '1d' }));

// ========== CRUD ROUTE FACTORY ==========
/**
 * Generic CRUD route factory to eliminate duplication
 * @param {string} resource - Plural resource name (e.g., 'zahlungen')
 * @param {string} file - Path to JSON file
 * @param {object} options - Configuration options
 *   @param {object} options.schema - Joi validation schema for POST
 *   @param {string} options.singularKey - Singular form for response (auto-generated if not provided)
 *   @param {function} options.beforeGet - Hook to modify data before GET response
 */
function createCrudRoutes(resource, file, options = {}) {
  const { schema, singularKey, beforeGet } = options;

  // Auto-generate singular key if not provided
  const singular = singularKey || (
    resource.endsWith('en') ? resource.slice(0, -2) : // zahlungen → zahlung, forderungen → forderung
    resource.endsWith('s') ? resource.slice(0, -1) :  // contracts → contract
    resource // kosten → kosten (already singular-looking)
  );

  // GET - List all with optional userId filter
  app.get(`/api/${resource}`, (req, res) => {
    let data = readJSON(file);

    // Apply beforeGet hook if provided (for sample data initialization, etc.)
    if (beforeGet) data = beforeGet(data);

    const userId = req.query.userId;
    const filtered = userId ? data.filter(x => x.userId === userId) : data;
    res.json({ [resource]: filtered });
  });

  // POST - Create new item
  const postHandler = (req, res) => {
    const data = readJSON(file);
    const item = {
      id: Date.now().toString(),
      ...req.body,
      userId: req.body.userId,
      createdAt: new Date().toISOString()
    };
    data.push(item);
    const success = writeJSON(file, data);
    success
      ? res.status(201).json({ [singular]: item })
      : res.status(500).json({ error: 'Fehler beim Speichern' });
  };

  // Apply validation middleware if schema provided
  if (schema) {
    app.post(`/api/${resource}`, validate(schema), postHandler);
  } else {
    app.post(`/api/${resource}`, postHandler);
  }

  // PUT - Update existing item
  app.put(`/api/${resource}/:id`, (req, res) => {
    let data = readJSON(file);
    const idx = data.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });

    data[idx] = { ...data[idx], ...req.body, id: req.params.id };
    writeJSON(file, data);
    res.json({ [singular]: data[idx] });
  });

  // DELETE - Remove item
  app.delete(`/api/${resource}/:id`, (req, res) => {
    const filtered = readJSON(file).filter(x => x.id !== req.params.id);
    writeJSON(file, filtered);
    res.json({ ok: true });
  });
}

// ========== API ROUTES ==========

// Dashboard
app.get('/api/dashboard', (req, res) => res.json({ liquiditaet: 0, skontoMoeglichkeiten: 0, faelligeZahlungen: 0 }));

// Create CRUD routes for all resources
createCrudRoutes('zahlungen', FILES.zahlungen, {
  schema: schemas.transaction,
  singularKey: 'zahlung'
});

createCrudRoutes('contracts', FILES.contracts, {
  schema: schemas.contract,
  singularKey: 'contract',
  beforeGet: (data) => {
    // Initialize with sample data if empty
    if (!data.length) {
      writeJSON(FILES.contracts, SAMPLE_CONTRACTS);
      return SAMPLE_CONTRACTS;
    }
    return data;
  }
});
app.post('/api/contracts/upload', (req, res) => res.json({ ok: true }));

createCrudRoutes('kosten', FILES.kosten, {
  schema: schemas.transaction,
  singularKey: 'kosten' // Same in singular and plural
});

createCrudRoutes('forderungen', FILES.forderungen, {
  schema: schemas.transaction,
  singularKey: 'forderung'
});

createCrudRoutes('bankkonten', FILES.bankkonten, {
  singularKey: 'bankkonto'
  // Note: No validation schema for bankkonten
});

// Categories
app.get('/api/categories', (req, res) => res.json({ categories: readJSON(FILES.categories) }));
app.post('/api/categories', validate(schemas.category), (req, res) => {
  const { name } = req.body;
  const data = readJSON(FILES.categories);
  if (data.includes(name)) return res.status(409).json({ error: 'Existiert bereits' });
  data.push(name);
  writeJSON(FILES.categories, data);
  res.status(201).json({ categories: data });
});
app.delete('/api/categories/:name', (req, res) => {
  writeJSON(FILES.categories, readJSON(FILES.categories).filter(c => c !== req.params.name));
  res.json({ ok: true });
});

// Onboarding
app.get('/api/onboarding', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'E-Mail fehlt' });
  const all = readJSON(FILES.onboarding);
  res.json({ data: all[email] || null });
});
app.post('/api/onboarding', (req, res) => {
  const { email, data } = req.body;
  if (!email || !data) return res.status(400).json({ error: 'Daten fehlen' });
  const all = readJSON(FILES.onboarding);
  all[email] = data;
  writeJSON(FILES.onboarding, all);
  res.json({ ok: true, data: all[email] });
});

// Users
app.post('/api/users/register', validate(schemas.user), async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    const users = readJSON(FILES.users);
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Benutzer existiert bereits' });

    // Hash password with bcrypt (secure, salted hashing)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = { email, name: name || '', company: company || '', passwordHash, createdAt: new Date().toISOString() };
    users.push(user);
    writeJSON(FILES.users, users);
    // Ajout du rôle geschaeftsfuehrer dans permissions.json
    const perms = readJSON(FILES.permissions);
    if (!perms.globalPermissions) perms.globalPermissions = {};
    perms.globalPermissions[email] = {
      role: 'geschaeftsfuehrer',
      permissions: {
        entitaeten: { view: true, edit: true, delete: true, manage: true },
        bankkonten: { view: true, edit: true, delete: true },
        kosten: { view: true, edit: true, delete: true },
        forderungen: { view: true, edit: true, delete: true },
        zahlungen: { view: true, edit: true, delete: true },
        vertrage: { view: true, edit: true, delete: true },
        liquiditat: { view: true, edit: true },
        reports: { view: true, edit: true },
        kpis: { view: true, edit: true },
        einstellungen: { view: true, edit: true },
        permissions: { view: true, edit: true }
      }
    };
    writeJSON(FILES.permissions, perms);
    console.log(`[INSCRIPTION] Nouvel utilisateur: ${user.email} | Nom: ${user.name} | Société: ${user.company} | Date: ${user.created}`);
    res.status(201).json({ user: { email: user.email, name: user.name, company: user.company } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Fehler bei der Registrierung' });
  }
});
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-Mail oder Passwort fehlt' });
    const users = readJSON(FILES.users);
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

    // Compare password with bcrypt (secure comparison with timing attack protection)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return res.status(401).json({ error: 'Falsches Passwort' });

    res.json({ user: { email: user.email, name: user.name, company: user.company } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Fehler beim Login' });
  }
});
app.post('/api/users/invite', (req, res) => {
  const { adminEmail, targetEmail, firstName, lastName, permissions } = req.body;
  if (!adminEmail || !targetEmail || !firstName) return res.status(400).json({ error: 'Parameter fehlen' });
  const users = readJSON(FILES.users);
  const perms = readJSON(FILES.permissions);
  if (perms.globalPermissions[adminEmail]?.role !== 'geschaeftsfuehrer') return res.status(403).json({ error: 'Nur Geschäftsführer' });
  if (users.find(u => u.email === targetEmail)) return res.status(400).json({ error: 'Benutzer existiert' });
  
  const adminUser = users.find(u => u.email === adminEmail);
  const newUser = { email: targetEmail, name: `${firstName} ${lastName || ''}`.trim(), company: adminUser?.company || '', createdAt: new Date().toISOString() };
  users.push(newUser);
  if (permissions) perms.globalPermissions[targetEmail] = { role: 'employee', permissions };
  
  writeJSON(FILES.users, users);
  writeJSON(FILES.permissions, perms);
  res.json({ success: true, user: newUser });
});

// Entitäten
app.get('/api/entitaeten', (req, res) => {
  const { email } = req.query;
  const data = readJSON(FILES.entitaeten);
  if (!email) return res.json({ entitaeten: data });
  
  const perms = readJSON(FILES.permissions);
  const isGF = perms.globalPermissions[email]?.role === 'geschaeftsfuehrer';
  
  if (isGF) {
    const users = readJSON(FILES.users);
    const currentUser = users.find(u => u.email === email);
    const companyUsers = users.filter(u => u.company === currentUser?.company).map(u => u.email);
    const filtered = data.filter(e => {
      const managers = e.managers || (e.manager ? [e.manager] : []);
      return managers.some(m => companyUsers.includes(m));
    });
    return res.json({ entitaeten: filtered });
  }
  
  const userEntities = data.filter(e => {
    const managers = e.managers || (e.manager ? [e.manager] : []);
    return managers.includes(email);
  });
  res.json({ entitaeten: userEntities });
});
app.post('/api/entitaeten', validate(schemas.entity), (req, res) => {
  const { name, manager, managers, type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name fehlt' });
  const entityManagers = managers && Array.isArray(managers) ? managers : (manager ? [manager] : []);
  if (!entityManagers.length) return res.status(400).json({ error: 'Manager fehlt' });
  
  const data = readJSON(FILES.entitaeten);
  const item = { id: Date.now().toString(), name, managers: entityManagers, type: type || 'standard', createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.entitaeten, data);
  res.status(201).json({ entity: item });
});
app.put('/api/entitaeten/:id', (req, res) => {
  let data = readJSON(FILES.entitaeten);
  const idx = data.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  data[idx] = { ...data[idx], ...req.body, id: req.params.id, updated: new Date().toISOString() };
  writeJSON(FILES.entitaeten, data);
  res.json({ entity: data[idx] });
});
app.delete('/api/entitaeten/:id', (req, res) => {
  writeJSON(FILES.entitaeten, readJSON(FILES.entitaeten).filter(e => e.id !== req.params.id));
  const perms = readJSON(FILES.permissions);
  delete perms.entityPermissions[req.params.id];
  writeJSON(FILES.permissions, perms);
  res.json({ ok: true });
});

// Permissions
app.get('/api/permissions/user/:email', (req, res) => {
  const perms = readJSON(FILES.permissions);
  const userPerms = { global: perms.globalPermissions[req.params.email] || null, entities: {} };
  Object.keys(perms.entityPermissions || {}).forEach(entityId => {
    if (perms.entityPermissions[entityId]?.[req.params.email]) {
      userPerms.entities[entityId] = perms.entityPermissions[entityId][req.params.email];
    }
  });
  res.json({ permissions: userPerms });
});
app.post('/api/permissions/global', (req, res) => {
  const { adminEmail, targetEmail, permissions } = req.body;
  if (!adminEmail || !targetEmail || !permissions) return res.status(400).json({ error: 'Parameter fehlen' });
  const perms = readJSON(FILES.permissions);
  if (perms.globalPermissions[adminEmail]?.role !== 'geschaeftsfuehrer') return res.status(403).json({ error: 'Nur Geschäftsführer' });
  perms.globalPermissions[targetEmail] = permissions;
  writeJSON(FILES.permissions, perms);
  res.json({ success: true });
});
app.post('/api/permissions/entity', (req, res) => {
  const { adminEmail, entityId, targetEmail, permissions } = req.body;
  if (!adminEmail || !entityId || !targetEmail || !permissions) return res.status(400).json({ error: 'Parameter fehlen' });
  const perms = readJSON(FILES.permissions);
  if (!perms.entityPermissions[entityId]) perms.entityPermissions[entityId] = {};
  perms.entityPermissions[entityId][targetEmail] = permissions;
  writeJSON(FILES.permissions, perms);
  res.json({ success: true });
});
app.get('/api/permissions/all', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'E-Mail fehlt' });
  const perms = readJSON(FILES.permissions);
  const users = readJSON(FILES.users);
  
  // Trouver l'utilisateur actuel et sa société
  const currentUser = users.find(u => u.email === email);
  if (!currentUser) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  
  if (!perms.globalPermissions[email]) {
    perms.globalPermissions[email] = { role: 'geschaeftsfuehrer', permissions: {} };
    writeJSON(FILES.permissions, perms);
  }
  
  // SÉCURITÉ: Filtrer pour ne montrer que les utilisateurs de la MÊME entreprise
  const companyUsers = users.filter(u => u.company === currentUser.company);
  
  const result = companyUsers.map(u => ({ 
    email: u.email, 
    name: u.name, 
    company: u.company, 
    globalPermissions: perms.globalPermissions[u.email] || null 
  }));
  
  // Filtrer les permissions d'entités pour ne montrer que celles liées à cette entreprise
  const entitaeten = readJSON(FILES.entitaeten);
  const companyEmails = companyUsers.map(u => u.email);
  const companyEntities = entitaeten.filter(e => {
    const managers = e.managers || (e.manager ? [e.manager] : []);
    return managers.some(m => companyEmails.includes(m));
  });
  const companyEntityIds = companyEntities.map(e => e.id);
  
  const filteredEntityPermissions = {};
  companyEntityIds.forEach(entityId => {
    if (perms.entityPermissions[entityId]) {
      filteredEntityPermissions[entityId] = perms.entityPermissions[entityId];
    }
  });
  
  res.json({ users: result, entityPermissions: filteredEntityPermissions });
});
app.delete('/api/permissions/:type/:email', (req, res) => {
  const { type, email } = req.params;
  const { adminEmail, entityId } = req.query;
  if (!adminEmail) return res.status(400).json({ error: 'Admin fehlt' });
  const perms = readJSON(FILES.permissions);
  
  if (type === 'global') {
    delete perms.globalPermissions[email];
  } else if (type === 'entity' && entityId) {
    if (perms.entityPermissions[entityId]) delete perms.entityPermissions[entityId][email];
  }
  writeJSON(FILES.permissions, perms);
  res.json({ ok: true });
});
app.post('/api/permissions/invite', (req, res) => {
  const { adminEmail, targetEmail, entityId, permissions } = req.body;
  if (!adminEmail || !targetEmail || !entityId || !permissions) return res.status(400).json({ error: 'Parameter fehlen' });
  const perms = readJSON(FILES.permissions);
  const invitation = { id: Date.now().toString(), from: adminEmail, to: targetEmail, entityId, permissions, createdAt: new Date().toISOString(), status: 'pending' };
  perms.invitations = perms.invitations || [];
  perms.invitations.push(invitation);
  writeJSON(FILES.permissions, perms);
  res.json({ success: true, invitation });
});

// Bookings
app.get('/api/bookings', (req, res) => res.json({ bookings: readJSON(FILES.bookings) }));
app.post('/api/bookings', (req, res) => {
  const data = readJSON(FILES.bookings);
  const item = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.bookings, data);
  res.status(201).json({ booking: item });
});

// KPIs - Real calculations from actual data
app.get('/api/kpis', (req, res) => {
  try {
    const { companyId } = req.query;

    // Load all data
    const bankkonten = readJSON(FILES.bankkonten).filter(b => !companyId || b.companyId === companyId);
    const zahlungen = readJSON(FILES.zahlungen).filter(z => !companyId || z.companyId === companyId);
    const kosten = readJSON(FILES.kosten).filter(k => !companyId || k.companyId === companyId);
    const forderungen = readJSON(FILES.forderungen).filter(f => !companyId || f.companyId === companyId);

    // Calculate total liquidity (cash on hand)
    const totalLiquidity = bankkonten.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);

    // Calculate revenue (from paid receivables)
    const totalRevenue = forderungen
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    // Calculate expenses (costs + completed payments)
    const totalCosts = kosten.reduce((sum, k) => sum + (parseFloat(k.amount) || 0), 0);
    const completedPayments = zahlungen
      .filter(z => z.status === 'completed')
      .reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);
    const totalExpenses = totalCosts + completedPayments;

    // Calculate profit and margin
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;

    // Calculate open receivables
    const openReceivables = forderungen
      .filter(f => f.status === 'open')
      .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    // Calculate pending payments
    const pendingPayments = zahlungen
      .filter(z => z.status === 'pending')
      .reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);

    // Calculate burn rate (average monthly expenses)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCosts = kosten.filter(k => {
      if (!k.date) return false;
      const date = new Date(k.date);
      return date >= thirtyDaysAgo && date <= now;
    });

    const recentPayments = zahlungen.filter(z => {
      if (!z.date || z.status !== 'completed') return false;
      const date = new Date(z.date);
      return date >= thirtyDaysAgo && date <= now;
    });

    const monthlyExpenses = recentCosts.reduce((sum, k) => sum + (parseFloat(k.amount) || 0), 0) +
                           recentPayments.reduce((sum, z) => sum + (parseFloat(z.amount) || 0), 0);

    const dailyBurnRate = recentCosts.length > 0 || recentPayments.length > 0 ? monthlyExpenses / 30 : 0;
    const monthlyBurnRate = dailyBurnRate * 30;

    // Calculate runway (months until cash runs out)
    const runwayMonths = dailyBurnRate > 0 ? (totalLiquidity / (dailyBurnRate * 30)) : Infinity;

    // Calculate liquidity ratio (current assets / current liabilities)
    const currentAssets = totalLiquidity + openReceivables;
    const currentLiabilities = pendingPayments;
    const liquidityRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : Infinity;

    // Calculate average payment period (for paid receivables)
    const paidForderungen = forderungen.filter(f => f.status === 'paid' && f.dueDate);
    let avgPaymentDays = 0;
    if (paidForderungen.length > 0) {
      const totalDays = paidForderungen.reduce((sum, f) => {
        const dueDate = new Date(f.dueDate);
        const today = new Date();
        const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        return sum + Math.abs(daysDiff);
      }, 0);
      avgPaymentDays = totalDays / paidForderungen.length;
    }

    const kpis = {
      // Financial Overview
      'Gesamtliquidität': `CHF ${totalLiquidity.toFixed(2)}`,
      'Umsatz (Bezahlt)': `CHF ${totalRevenue.toFixed(2)}`,
      'Gesamtausgaben': `CHF ${totalExpenses.toFixed(2)}`,
      'Gewinn': `CHF ${profit.toFixed(2)}`,
      'Gewinnmarge': `${profitMargin.toFixed(1)}%`,

      // Cashflow Metrics
      'Offene Forderungen': `CHF ${openReceivables.toFixed(2)}`,
      'Ausstehende Zahlungen': `CHF ${pendingPayments.toFixed(2)}`,
      'Netto Cashflow': `CHF ${(openReceivables - pendingPayments).toFixed(2)}`,

      // Burn Rate & Runway
      'Tägliche Ausgaben Ø': `CHF ${dailyBurnRate.toFixed(2)}`,
      'Monatliche Ausgaben': `CHF ${monthlyBurnRate.toFixed(2)}`,
      'Runway': runwayMonths === Infinity ? '∞ Monate' : `${runwayMonths.toFixed(1)} Monate`,

      // Liquidity & Efficiency
      'Liquiditätsquote': liquidityRatio === Infinity ? '∞' : liquidityRatio.toFixed(2),
      'Ø Zahlungsziel': `${avgPaymentDays.toFixed(0)} Tage`,

      // Counts
      'Anzahl Bankkonten': bankkonten.length,
      'Anzahl Forderungen': forderungen.length,
      'Anzahl Kosten': kosten.length,
      'Anzahl Zahlungen': zahlungen.length
    };

    res.json({ kpis });
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    res.status(500).json({ error: 'Fehler beim Berechnen der KPIs', kpis: {} });
  }
});
app.post('/api/reports', (req, res) => res.json({ report: { id: Date.now().toString(), ...req.body } }));
app.post('/api/export/pdf', (req, res) => res.json({ url: '/export/report.pdf' }));
app.post('/api/export/excel', (req, res) => res.json({ url: '/export/report.xlsx' }));
app.get('/api/abonnement', (req, res) => res.json({ abonnement: { status: 'active', plan: 'Starter', price: 49 } }));
app.put('/api/abonnement', (req, res) => res.json({ ok: true }));
app.get('/api/einstellungen', (req, res) => res.json({ settings: {} }));
app.put('/api/einstellungen', (req, res) => res.json({ ok: true }));

// ========== FORDERUNGEN KATEGORIEN API ==========
// GET - Alle Forderungskategorien abrufen
app.get('/api/forderungen-kategorien', (req, res) => {
  try {
    const kategorien = readJSON(FILES.forderungenKategorien);
    res.json(kategorien);
  } catch (error) {
    console.error('Error reading forderungen kategorien:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kategorien' });
  }
});

// POST - Neue Forderungskategorie erstellen
app.post('/api/forderungen-kategorien', (req, res) => {
  try {
    const kategorien = readJSON(FILES.forderungenKategorien);
    const { name, description, color, icon } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Kategoriename ist erforderlich' });
    }

    // Check if category name already exists
    const existingCategory = kategorien.find(k => k.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
      return res.status(400).json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' });
    }

    const neueKategorie = {
      id: `CAT-${Date.now()}`,
      name: name.trim(),
      description: description || '',
      color: color || '#607d8b',
      icon: icon || 'folder',
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    kategorien.push(neueKategorie);
    writeJSON(FILES.forderungenKategorien, kategorien);

    res.status(201).json(neueKategorie);
  } catch (error) {
    console.error('Error creating kategorie:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kategorie' });
  }
});

// PUT - Forderungskategorie aktualisieren
app.put('/api/forderungen-kategorien/:id', (req, res) => {
  try {
    const kategorien = readJSON(FILES.forderungenKategorien);
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const index = kategorien.findIndex(k => k.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' });
    }

    // Check if new name conflicts with existing category
    if (name) {
      const existingCategory = kategorien.find(k => k.id !== id && k.name.toLowerCase() === name.toLowerCase());
      if (existingCategory) {
        return res.status(400).json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' });
      }
    }

    // Update category
    kategorien[index] = {
      ...kategorien[index],
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(icon && { icon }),
      updated: new Date().toISOString()
    };

    writeJSON(FILES.forderungenKategorien, kategorien);
    res.json(kategorien[index]);
  } catch (error) {
    console.error('Error updating kategorie:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Kategorie' });
  }
});

// DELETE - Forderungskategorie löschen
app.delete('/api/forderungen-kategorien/:id', (req, res) => {
  try {
    const kategorien = readJSON(FILES.forderungenKategorien);
    const forderungen = readJSON(FILES.forderungen);
    const { id } = req.params;

    const kategorie = kategorien.find(k => k.id === id);
    if (!kategorie) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' });
    }

    // Prevent deleting default categories
    if (kategorie.isDefault) {
      return res.status(400).json({ error: 'Standard-Kategorien können nicht gelöscht werden' });
    }

    // Check if category is in use
    const inUse = forderungen.some(f => f.kategorie === id);
    if (inUse) {
      return res.status(400).json({
        error: 'Diese Kategorie wird noch verwendet und kann nicht gelöscht werden',
        inUse: true
      });
    }

    const filtered = kategorien.filter(k => k.id !== id);
    writeJSON(FILES.forderungenKategorien, filtered);

    res.json({ ok: true, message: 'Kategorie erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting kategorie:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Kategorie' });
  }
});

// ========== ZAHLUNGEN KATEGORIEN API ==========
// GET - Alle Zahlungskategorien abrufen
app.get('/api/zahlungen-kategorien', (req, res) => {
  try {
    const kategorien = readJSON(FILES.zahlungenKategorien);
    res.json(kategorien);
  } catch (error) {
    console.error('Error reading zahlungen kategorien:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kategorien' });
  }
});

// POST - Neue Zahlungskategorie erstellen
app.post('/api/zahlungen-kategorien', (req, res) => {
  try {
    const kategorien = readJSON(FILES.zahlungenKategorien);
    const { name, description, color, icon, priority } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Kategoriename ist erforderlich' });
    }

    // Check if category name already exists
    const existingCategory = kategorien.find(k => k.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
      return res.status(400).json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' });
    }

    const neueKategorie = {
      id: `ZKAT-${Date.now()}`,
      name: name.trim(),
      description: description || '',
      color: color || '#607d8b',
      icon: icon || 'folder',
      priority: priority || 'medium',
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    kategorien.push(neueKategorie);
    writeJSON(FILES.zahlungenKategorien, kategorien);

    res.status(201).json(neueKategorie);
  } catch (error) {
    console.error('Error creating zahlungen kategorie:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kategorie' });
  }
});

// PUT - Zahlungskategorie aktualisieren
app.put('/api/zahlungen-kategorien/:id', (req, res) => {
  try {
    const kategorien = readJSON(FILES.zahlungenKategorien);
    const { id } = req.params;
    const { name, description, color, icon, priority } = req.body;

    const index = kategorien.findIndex(k => k.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' });
    }

    // Check if new name conflicts with existing category
    if (name) {
      const existingCategory = kategorien.find(k => k.id !== id && k.name.toLowerCase() === name.toLowerCase());
      if (existingCategory) {
        return res.status(400).json({ error: 'Eine Kategorie mit diesem Namen existiert bereits' });
      }
    }

    // Update category
    kategorien[index] = {
      ...kategorien[index],
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(icon && { icon }),
      ...(priority && { priority }),
      updated: new Date().toISOString()
    };

    writeJSON(FILES.zahlungenKategorien, kategorien);
    res.json(kategorien[index]);
  } catch (error) {
    console.error('Error updating zahlungen kategorie:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Kategorie' });
  }
});

// DELETE - Zahlungskategorie löschen
app.delete('/api/zahlungen-kategorien/:id', (req, res) => {
  try {
    const kategorien = readJSON(FILES.zahlungenKategorien);
    const zahlungen = readJSON(FILES.zahlungen);
    const { id } = req.params;

    const kategorie = kategorien.find(k => k.id === id);
    if (!kategorie) {
      return res.status(404).json({ error: 'Kategorie nicht gefunden' });
    }

    // Prevent deleting default categories
    if (kategorie.isDefault) {
      return res.status(400).json({ error: 'Standard-Kategorien können nicht gelöscht werden' });
    }

    // Check if category is in use
    const inUse = zahlungen.some(z => z.category === id);
    if (inUse) {
      return res.status(400).json({
        error: 'Diese Kategorie wird noch verwendet und kann nicht gelöscht werden',
        inUse: true
      });
    }

    const filtered = kategorien.filter(k => k.id !== id);
    writeJSON(FILES.zahlungenKategorien, filtered);

    res.json({ ok: true, message: 'Kategorie erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting zahlungen kategorie:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Kategorie' });
  }
});

// ========== LIQUIDITÄTSANALYSE NACH KATEGORIEN ==========
app.get('/api/liquiditaet/kategorien-analyse', (req, res) => {
  try {
    const forderungen = readJSON(FILES.forderungen);
    const kategorien = readJSON(FILES.forderungenKategorien);
    const { startDate, endDate, status } = req.query;

    // Filter forderungen by date range if provided
    let filteredForderungen = forderungen;
    if (startDate || endDate) {
      filteredForderungen = forderungen.filter(f => {
        const dueDate = new Date(f.dueDate);
        if (startDate && dueDate < new Date(startDate)) return false;
        if (endDate && dueDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      filteredForderungen = filteredForderungen.filter(f => f.status === status);
    }

    // Calculate statistics per category
    const kategorieStats = {};
    const kategorieMap = {};

    // Create map of categories for quick lookup
    kategorien.forEach(k => {
      kategorieMap[k.id] = k;
      kategorieStats[k.id] = {
        id: k.id,
        name: k.name,
        color: k.color,
        icon: k.icon,
        totalAmount: 0,
        openAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        count: 0,
        openCount: 0,
        paidCount: 0,
        overdueCount: 0,
        avgAmount: 0,
        avgPaymentDays: 0,
        paymentDaysSum: 0,
        paymentDaysCount: 0,
        skontoAvailable: 0,
        skontoCaptured: 0,
        skontoMissed: 0
      };
    });

    // Uncategorized
    kategorieStats['uncategorized'] = {
      id: 'uncategorized',
      name: 'Nicht kategorisiert',
      color: '#9e9e9e',
      icon: 'help',
      totalAmount: 0,
      openAmount: 0,
      paidAmount: 0,
      overdueAmount: 0,
      count: 0,
      openCount: 0,
      paidCount: 0,
      overdueCount: 0,
      avgAmount: 0,
      avgPaymentDays: 0,
      paymentDaysSum: 0,
      paymentDaysCount: 0,
      skontoAvailable: 0,
      skontoCaptured: 0,
      skontoMissed: 0
    };

    const today = new Date();

    // Aggregate data
    filteredForderungen.forEach(forderung => {
      const kategorieId = forderung.kategorie || 'uncategorized';
      const stats = kategorieStats[kategorieId];

      if (!stats) return; // Skip if category doesn't exist

      const amount = parseFloat(forderung.amount) || 0;
      stats.totalAmount += amount;
      stats.count++;

      // Status breakdown
      if (forderung.status === 'open') {
        stats.openAmount += amount;
        stats.openCount++;

        // Check if overdue
        const dueDate = new Date(forderung.dueDate);
        if (dueDate < today) {
          stats.overdueAmount += amount;
          stats.overdueCount++;
        }
      } else if (forderung.status === 'paid') {
        stats.paidAmount += amount;
        stats.paidCount++;

        // Calculate payment days (from due date to paid date)
        if (forderung.dueDate && forderung.paidDate) {
          const dueDate = new Date(forderung.dueDate);
          const paidDate = new Date(forderung.paidDate);
          const daysDiff = Math.floor((paidDate - dueDate) / (1000 * 60 * 60 * 24));
          stats.paymentDaysSum += daysDiff;
          stats.paymentDaysCount++;
        }
      }

      // Skonto analysis
      if (forderung.skonto && forderung.skonto > 0) {
        const skontoAmount = (amount * forderung.skonto) / 100;
        stats.skontoAvailable += skontoAmount;

        if (forderung.skontoStatus === 'captured') {
          stats.skontoCaptured += skontoAmount;
        } else if (forderung.skontoStatus === 'missed' || forderung.skontoStatus === 'expired') {
          stats.skontoMissed += skontoAmount;
        }
      }
    });

    // Calculate averages and percentages
    const resultStats = Object.values(kategorieStats).map(stats => {
      if (stats.count > 0) {
        stats.avgAmount = stats.totalAmount / stats.count;
      }
      if (stats.paymentDaysCount > 0) {
        stats.avgPaymentDays = stats.paymentDaysSum / stats.paymentDaysCount;
      }
      // Clean up temporary fields
      delete stats.paymentDaysSum;
      delete stats.paymentDaysCount;
      return stats;
    }).filter(stats => stats.count > 0); // Only return categories with data

    // Sort by total amount (highest first)
    resultStats.sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate totals
    const totals = {
      totalAmount: resultStats.reduce((sum, s) => sum + s.totalAmount, 0),
      openAmount: resultStats.reduce((sum, s) => sum + s.openAmount, 0),
      paidAmount: resultStats.reduce((sum, s) => sum + s.paidAmount, 0),
      overdueAmount: resultStats.reduce((sum, s) => sum + s.overdueAmount, 0),
      count: resultStats.reduce((sum, s) => sum + s.count, 0),
      skontoAvailable: resultStats.reduce((sum, s) => sum + s.skontoAvailable, 0),
      skontoCaptured: resultStats.reduce((sum, s) => sum + s.skontoCaptured, 0),
      skontoMissed: resultStats.reduce((sum, s) => sum + s.skontoMissed, 0)
    };

    // Add percentage of total for each category
    resultStats.forEach(stats => {
      stats.percentOfTotal = totals.totalAmount > 0
        ? (stats.totalAmount / totals.totalAmount) * 100
        : 0;
    });

    // Top performers
    const topByRevenue = [...resultStats].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);
    const topByCount = [...resultStats].sort((a, b) => b.count - a.count).slice(0, 5);
    const topBySkonto = [...resultStats].filter(s => s.skontoAvailable > 0).sort((a, b) => b.skontoCaptured - a.skontoCaptured).slice(0, 5);

    // Payment behavior insights
    const paymentBehavior = resultStats.map(stats => ({
      kategorie: stats.name,
      avgPaymentDays: stats.avgPaymentDays,
      behavior: stats.avgPaymentDays < -5 ? 'Sehr pünktlich' :
                stats.avgPaymentDays < 0 ? 'Pünktlich' :
                stats.avgPaymentDays < 7 ? 'Leicht verspätet' :
                stats.avgPaymentDays < 30 ? 'Verspätet' : 'Sehr verspätet'
    })).filter(b => b.avgPaymentDays !== 0);

    res.json({
      kategorien: resultStats,
      totals,
      insights: {
        topByRevenue,
        topByCount,
        topBySkonto,
        paymentBehavior,
        uncategorizedCount: kategorieStats['uncategorized'].count,
        uncategorizedAmount: kategorieStats['uncategorized'].totalAmount
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error('Error calculating kategorie analyse:', error);
    res.status(500).json({ error: 'Fehler bei der Kategorieanalyse' });
  }
});

// SPA fallback
app.get(/^\/(?!api|landing).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Kontiq Server: http://0.0.0.0:${PORT}`));
