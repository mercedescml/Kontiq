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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.use(express.static('public', { maxAge: '1d' }));

// ========== API ROUTES ==========

// Dashboard
app.get('/api/dashboard', (req, res) => res.json({ liquiditaet: 0, skontoMoeglichkeiten: 0, faelligeZahlungen: 0 }));

// Zahlungen
app.get('/api/zahlungen', (req, res) => {
  const data = readJSON(FILES.zahlungen);
  const userId = req.query.userId;
  const filtered = userId ? data.filter(x => x.userId === userId) : data;
  res.json({ zahlungen: filtered });
});
app.post('/api/zahlungen', validate(schemas.transaction), (req, res) => {
  const data = readJSON(FILES.zahlungen);
  const item = { id: Date.now().toString(), ...req.body, userId: req.body.userId, createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.zahlungen, data) ? res.status(201).json({ zahlung: item }) : res.status(500).json({ error: 'Fehler' });
});
app.put('/api/zahlungen/:id', (req, res) => {
  let data = readJSON(FILES.zahlungen);
  const idx = data.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  data[idx] = { ...data[idx], ...req.body, id: req.params.id };
  writeJSON(FILES.zahlungen, data);
  res.json({ zahlung: data[idx] });
});
app.delete('/api/zahlungen/:id', (req, res) => {
  let data = readJSON(FILES.zahlungen).filter(x => x.id !== req.params.id);
  writeJSON(FILES.zahlungen, data);
  res.json({ ok: true });
});

// Contracts
app.get('/api/contracts', (req, res) => {
  let data = readJSON(FILES.contracts);
  if (!data.length) { data = SAMPLE_CONTRACTS; writeJSON(FILES.contracts, data); }
  const userId = req.query.userId;
  const filtered = userId ? data.filter(x => x.userId === userId) : data;
  res.json({ contracts: filtered });
});
app.post('/api/contracts', validate(schemas.contract), (req, res) => {
  const data = readJSON(FILES.contracts);
  const item = { id: Date.now().toString(), ...req.body, userId: req.body.userId, createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.contracts, data) ? res.status(201).json({ contract: item }) : res.status(500).json({ error: 'Fehler' });
});
app.put('/api/contracts/:id', (req, res) => {
  let data = readJSON(FILES.contracts);
  const idx = data.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  data[idx] = { ...data[idx], ...req.body, id: req.params.id };
  writeJSON(FILES.contracts, data);
  res.json({ contract: data[idx] });
});
app.delete('/api/contracts/:id', (req, res) => {
  writeJSON(FILES.contracts, readJSON(FILES.contracts).filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});
app.post('/api/contracts/upload', (req, res) => res.json({ ok: true }));

// Kosten
app.get('/api/kosten', (req, res) => {
  const data = readJSON(FILES.kosten);
  const userId = req.query.userId;
  const filtered = userId ? data.filter(x => x.userId === userId) : data;
  res.json({ kosten: filtered });
});
app.post('/api/kosten', validate(schemas.transaction), (req, res) => {
  const data = readJSON(FILES.kosten);
  const item = { id: Date.now().toString(), ...req.body, userId: req.body.userId, createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.kosten, data);
  res.status(201).json({ kosten: item });
});
app.put('/api/kosten/:id', (req, res) => {
  let data = readJSON(FILES.kosten);
  const idx = data.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  data[idx] = { ...data[idx], ...req.body, id: req.params.id };
  writeJSON(FILES.kosten, data);
  res.json({ kosten: data[idx] });
});
app.delete('/api/kosten/:id', (req, res) => {
  writeJSON(FILES.kosten, readJSON(FILES.kosten).filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

// Forderungen
app.get('/api/forderungen', (req, res) => {
  const data = readJSON(FILES.forderungen);
  const userId = req.query.userId;
  const filtered = userId ? data.filter(x => x.userId === userId) : data;
  res.json({ forderungen: filtered });
});
app.post('/api/forderungen', validate(schemas.transaction), (req, res) => {
  const data = readJSON(FILES.forderungen);
  const item = { id: Date.now().toString(), ...req.body, userId: req.body.userId, createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.forderungen, data);
  res.status(201).json({ forderung: item });
});
app.put('/api/forderungen/:id', (req, res) => {
  let data = readJSON(FILES.forderungen);
  const idx = data.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  data[idx] = { ...data[idx], ...req.body, id: req.params.id };
  writeJSON(FILES.forderungen, data);
  res.json({ forderung: data[idx] });
});
app.delete('/api/forderungen/:id', (req, res) => {
  writeJSON(FILES.forderungen, readJSON(FILES.forderungen).filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

// Bankkonten
app.get('/api/bankkonten', (req, res) => {
  const data = readJSON(FILES.bankkonten);
  const userId = req.query.userId;
  const filtered = userId ? data.filter(x => x.userId === userId) : data;
  res.json({ bankkonten: filtered });
});
app.post('/api/bankkonten', (req, res) => {
  const data = readJSON(FILES.bankkonten);
  const item = { id: Date.now().toString(), ...req.body, userId: req.body.userId, createdAt: new Date().toISOString() };
  data.push(item);
  writeJSON(FILES.bankkonten, data);
  res.status(201).json({ bankkonto: item });
});
app.put('/api/bankkonten/:id', (req, res) => {
  let data = readJSON(FILES.bankkonten);
  const idx = data.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  data[idx] = { ...data[idx], ...req.body, id: req.params.id };
  writeJSON(FILES.bankkonten, data);
  res.json({ bankkonto: data[idx] });
});
app.delete('/api/bankkonten/:id', (req, res) => {
  writeJSON(FILES.bankkonten, readJSON(FILES.bankkonten).filter(x => x.id !== req.params.id));
  res.json({ ok: true });
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

    const user = { email, name: name || '', company: company || '', passwordHash, created: new Date().toISOString() };
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
  const item = { id: Date.now().toString(), name, managers: entityManagers, manager: entityManagers[0], type: type || 'standard', created: new Date().toISOString() };
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
  const invitation = { id: Date.now().toString(), from: adminEmail, to: targetEmail, entityId, permissions, created: new Date().toISOString(), status: 'pending' };
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

// SPA fallback
app.get(/^\/(?!api|landing).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Kontiq Server: http://0.0.0.0:${PORT}`));
