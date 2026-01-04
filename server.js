const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');
const DATA_DIR = path.join(__dirname, 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ONBOARDING_FILE = path.join(DATA_DIR, 'onboarding.json');
const PERMISSIONS_FILE = path.join(DATA_DIR, 'permissions.json');
const ENTITAETEN_FILE = path.join(DATA_DIR, 'entitaeten.json');
const CONTRACTS_FILE = path.join(DATA_DIR, 'contracts.json');

// Default sample contracts used when none exist (keeps UI from staying empty)
const SAMPLE_CONTRACTS = [
  {
    id: 'sample-1',
    name: 'Mietvertrag Bürofläche',
    partner: 'Immobilien Schmidt GmbH',
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    amount: 2500,
    status: 'active',
    description: 'Büro im 3. Stock, 120m², inkl. Nebenkosten'
  },
  {
    id: 'sample-2',
    name: 'Software-Lizenz Microsoft 365',
    partner: 'Microsoft Deutschland GmbH',
    startDate: '2024-03-01',
    endDate: '2027-02-28',
    amount: 5400,
    status: 'active',
    description: '15 Business Premium Lizenzen'
  }
];

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCategories() {
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) return [];
    const raw = fs.readFileSync(CATEGORIES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading categories', e);
    return [];
  }
}

function writeCategories(list) {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing categories', e);
    return false;
  }
}

function readOnboarding() {
  try {
    if (!fs.existsSync(ONBOARDING_FILE)) return {};
    const raw = fs.readFileSync(ONBOARDING_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading onboarding', e);
    return {};
  }
}

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading users', e);
    return [];
  }
}

function writeUsers(list) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing users', e);
    return false;
  }
}

function readPermissions() {
  try {
    if (!fs.existsSync(PERMISSIONS_FILE)) {
      const defaultPerms = {
        globalPermissions: {},
        entityPermissions: {},
        invitations: []
      };
      writePermissions(defaultPerms);
      return defaultPerms;
    }
    const raw = fs.readFileSync(PERMISSIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading permissions', e);
    return { globalPermissions: {}, entityPermissions: {}, invitations: [] };
  }
}

function writePermissions(data) {
  try {
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing permissions', e);
    return false;
  }
}

function readEntitaeten() {
  try {
    if (!fs.existsSync(ENTITAETEN_FILE)) return [];
    const raw = fs.readFileSync(ENTITAETEN_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading entitaeten', e);
    return [];
  }
}

function writeEntitaeten(list) {
  try {
    fs.writeFileSync(ENTITAETEN_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing entitaeten', e);
    return false;
  }
}

function readContracts() {
  try {
    if (!fs.existsSync(CONTRACTS_FILE)) return [];
    const raw = fs.readFileSync(CONTRACTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading contracts', e);
    return [];
  }
}

function writeContracts(list) {
  try {
    fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing contracts', e);
    return false;
  }
}

const crypto = require('crypto');

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd || '').digest('hex');
}

function writeOnboarding(obj) {
  try {
    fs.writeFileSync(ONBOARDING_FILE, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing onboarding', e);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de cache pour les ressources statiques
app.use((req, res, next) => {
  // HTML - pas de cache ou très court
  if (req.path.endsWith('.html')) {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // CSS et JS - long cache
  else if (req.path.endsWith('.css') || req.path.endsWith('.js')) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Images et fonts
  else if (req.path.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // API - pas de cache
  else if (req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  next();
});

// Landing page comme page d'accueil (AVANT express.static)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));

// Simple request logging for debug
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// API Route für Zahlungen
app.get('/api/zahlungen', (req, res) => {
  res.json({ 
    nachricht: 'API Zahlungen - In Entwicklung',
    zahlungen: []
  });
});

// API Route für Dashboard
app.get('/api/dashboard', (req, res) => {
  res.json({ 
    nachricht: 'Kontiq Dashboard',
    liquiditaet: 0,
    skontoMoeglichkeiten: 0,
    faelligeZahlungen: 0
  });
});

// Contracts API (Verträge)
app.get('/api/contracts', (req, res) => {
  let contracts = readContracts();

  // Seed with samples if empty to prevent blank UI
  if (!contracts || contracts.length === 0) {
    contracts = SAMPLE_CONTRACTS;
    writeContracts(contracts);
  }

  res.json({ contracts });
});

app.post('/api/contracts', (req, res) => {
  const data = req.body || {};
  const contracts = readContracts();

  const newContract = {
    id: Date.now().toString(),
    name: data.name || 'Neuer Vertrag',
    partner: data.partner || '',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    amount: data.amount || 0,
    status: data.status || 'active',
    description: data.description || '',
    createdAt: new Date().toISOString()
  };

  contracts.push(newContract);
  if (!writeContracts(contracts)) return res.status(500).json({ error: 'Vertrag konnte nicht gespeichert werden' });
  res.status(201).json({ contract: newContract });
});

app.put('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body || {};
  const contracts = readContracts();
  const idx = contracts.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Vertrag nicht gefunden' });
  contracts[idx] = { ...contracts[idx], ...data, id };
  if (!writeContracts(contracts)) return res.status(500).json({ error: 'Vertrag konnte nicht gespeichert werden' });
  res.json({ contract: contracts[idx] });
});

app.delete('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  const contracts = readContracts();
  const existing = contracts.find(c => c.id === id);
  if (!existing) return res.status(404).json({ error: 'Vertrag nicht gefunden' });
  const updated = contracts.filter(c => c.id !== id);
  if (!writeContracts(updated)) return res.status(500).json({ error: 'Vertrag konnte nicht gelöscht werden' });
  res.json({ ok: true });
});

// Placeholder upload endpoint to keep UI functional
app.post('/api/contracts/upload', (req, res) => {
  res.json({ ok: true, uploaded: true });
});

// Categories API
app.get('/api/categories', (req, res) => {
  console.log('GET /api/categories');
  const categories = readCategories();
  res.json({ categories });
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Ungültiger Kategoriename' });
  const categories = readCategories();
  if (categories.includes(name)) return res.status(409).json({ error: 'Kategorie existiert bereits' });
  categories.push(name);
  if (writeCategories(categories)) return res.status(201).json({ categories });
  return res.status(500).json({ error: 'Kategorie konnte nicht gespeichert werden' });
});

app.delete('/api/categories/:name', (req, res) => {
  const name = req.params.name;
  let categories = readCategories();
  if (!categories.includes(name)) return res.status(404).json({ error: 'Kategorie nicht gefunden' });
  categories = categories.filter(c => c !== name);
  if (writeCategories(categories)) return res.json({ categories });
  return res.status(500).json({ error: 'Kategorie konnte nicht gespeichert werden' });
});

// Onboarding persistence
app.get('/api/onboarding', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'E-Mail fehlt' });
  const all = readOnboarding();
  return res.json({ data: all[email] || null });
});

app.post('/api/onboarding', (req, res) => {
  const { email, data } = req.body;
  if (!email || !data) return res.status(400).json({ error: 'E-Mail oder Daten fehlen' });
  const all = readOnboarding();
  all[email] = data;
  if (writeOnboarding(all)) return res.json({ ok: true, data: all[email] });
  return res.status(500).json({ error: 'Onboarding konnte nicht gespeichert werden' });
});

// User registration & auth
app.post('/api/users/register', (req, res) => {
  const { email, password, name, company } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-Mail oder Passwort fehlt' });
  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Benutzer existiert bereits' });
  const user = {
    email,
    name: name || '',
    company: company || '',
    passwordHash: hashPassword(password),
    created: new Date().toISOString()
  };
  users.push(user);
  if (!writeUsers(users)) return res.status(500).json({ error: 'Benutzer konnte nicht gespeichert werden' });
  const safe = { email: user.email, name: user.name, company: user.company };
  return res.status(201).json({ user: safe });
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-Mail oder Passwort fehlt' });
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst.' });
  if (user.passwordHash !== hashPassword(password)) return res.status(401).json({ error: 'Falsches Passwort' });
  const safe = { email: user.email, name: user.name, company: user.company };
  return res.json({ user: safe });
});

// =======================
// PERMISSIONS API
// =======================

// Get user permissions
app.get('/api/permissions/user/:email', (req, res) => {
  const { email } = req.params;
  const perms = readPermissions();
  
  const userPerms = {
    global: perms.globalPermissions[email] || null,
    entities: {}
  };
  
  // Check entity-specific permissions
  Object.keys(perms.entityPermissions).forEach(entityId => {
    if (perms.entityPermissions[entityId][email]) {
      userPerms.entities[entityId] = perms.entityPermissions[entityId][email];
    }
  });
  
  res.json({ permissions: userPerms });
});

// Set global permissions (only Geschäftsführer)
app.post('/api/permissions/global', (req, res) => {
  const { adminEmail, targetEmail, permissions } = req.body;
  
  if (!adminEmail || !targetEmail || !permissions) {
    return res.status(400).json({ error: 'Fehlende Parameter' });
  }
  
  const perms = readPermissions();
  
  // Check if admin is Geschäftsführer
  if (!perms.globalPermissions[adminEmail] || perms.globalPermissions[adminEmail].role !== 'geschaeftsfuehrer') {
    return res.status(403).json({ error: 'Nur Geschäftsführer können globale Berechtigungen setzen' });
  }
  
  perms.globalPermissions[targetEmail] = permissions;
  
  if (writePermissions(perms)) {
    return res.json({ success: true, permissions: perms.globalPermissions[targetEmail] });
  }
  
  return res.status(500).json({ error: 'Berechtigungen konnten nicht gespeichert werden' });
});

// Set entity-specific permissions (Geschäftsführer or entity manager)
app.post('/api/permissions/entity', (req, res) => {
  const { adminEmail, entityId, targetEmail, permissions } = req.body;
  
  if (!adminEmail || !entityId || !targetEmail || !permissions) {
    return res.status(400).json({ error: 'Fehlende Parameter' });
  }
  
  const perms = readPermissions();
  const entitaeten = readEntitaeten();
  
  // Check if admin is Geschäftsführer
  const isGeschaeftsfuehrer = perms.globalPermissions[adminEmail]?.role === 'geschaeftsfuehrer';
  
  // Check if admin is entity manager (supports both single manager and array of managers)
  const entity = entitaeten.find(e => e.id === entityId);
  const entityManagers = entity?.managers || (entity?.manager ? [entity.manager] : []);
  const isEntityManager = entity && entityManagers.includes(adminEmail);
  
  if (!isGeschaeftsfuehrer && !isEntityManager) {
    return res.status(403).json({ error: 'Keine Berechtigung für diese Entität' });
  }
  
  if (!perms.entityPermissions[entityId]) {
    perms.entityPermissions[entityId] = {};
  }
  
  perms.entityPermissions[entityId][targetEmail] = permissions;
  
  if (writePermissions(perms)) {
    return res.json({ success: true, permissions: perms.entityPermissions[entityId][targetEmail] });
  }
  
  return res.status(500).json({ error: 'Berechtigungen konnten nicht gespeichert werden' });
});

// Get all users with permissions
app.get('/api/permissions/all', (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'E-Mail fehlt' });
  }
  
  const perms = readPermissions();
  const users = readUsers();
  const entitaeten = readEntitaeten();
  
  // Auto-assign Geschäftsführer role to user if not exists (each user is GF of their own company)
  if (!perms.globalPermissions[email]) {
    perms.globalPermissions[email] = {
      role: 'geschaeftsfuehrer',
      permissions: {
        dashboard: { view: true, edit: true },
        bankkonten: { view: true, edit: true, delete: true },
        zahlungen: { view: true, edit: true, delete: true },
        forderungen: { view: true, edit: true, delete: true },
        kosten: { view: true, edit: true, delete: true },
        liquiditat: { view: true, edit: true },
        vertrage: { view: true, edit: true, delete: true },
        kpis: { view: true, edit: true },
        reports: { view: true, edit: true }
      }
    };
    writePermissions(perms);
  }
  
  // Check if user is Geschäftsführer
  if (perms.globalPermissions[email].role !== 'geschaeftsfuehrer') {
    return res.status(403).json({ error: 'Nur Geschäftsführer können alle Berechtigungen sehen' });
  }
  
  // Get current user info
  const currentUser = users.find(u => u.email === email);
  const currentCompany = currentUser?.company;
  
  // Get entities managed by this user
  const myEntities = entitaeten.filter(e => e.manager === email);
  const myEntityIds = myEntities.map(e => e.id);
  
  // Find users who have permissions on my entities
  const usersWithEntityAccess = new Set();
  myEntityIds.forEach(entityId => {
    if (perms.entityPermissions[entityId]) {
      Object.keys(perms.entityPermissions[entityId]).forEach(userEmail => {
        usersWithEntityAccess.add(userEmail);
      });
    }
  });
  
  // Build user list: 
  // 1. Current user (GF) first
  // 2. Users from same company
  // 3. Users with access to my entities
  const result = [];
  
  // 1. Current user first
  if (currentUser) {
    result.push({
      email: currentUser.email,
      name: currentUser.name,
      company: currentUser.company,
      globalPermissions: perms.globalPermissions[currentUser.email] || null
    });
  }
  
  // 2. Other users (same company or with entity access)
  users.forEach(user => {
    if (user.email === email) return; // Skip current user (already added)
    
    const isSameCompany = user.company === currentCompany;
    const hasEntityAccess = usersWithEntityAccess.has(user.email);
    
    if (isSameCompany || hasEntityAccess) {
      result.push({
        email: user.email,
        name: user.name,
        company: user.company,
        globalPermissions: perms.globalPermissions[user.email] || null
      });
    }
  });
  
  res.json({ users: result, entityPermissions: perms.entityPermissions });
});

// Invite user with global permissions
app.post('/api/users/invite', (req, res) => {
  const { adminEmail, targetEmail, firstName, lastName, permissions } = req.body;
  
  if (!adminEmail || !targetEmail || !firstName || !lastName) {
    return res.status(400).json({ error: 'Fehlende Parameter' });
  }
  
  const perms = readPermissions();
  const users = readUsers();
  
  // Check if admin is Geschäftsführer
  const isGeschaeftsfuehrer = perms.globalPermissions[adminEmail]?.role === 'geschaeftsfuehrer';
  if (!isGeschaeftsfuehrer) {
    return res.status(403).json({ error: 'Nur Geschäftsführer können Benutzer einladen' });
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === targetEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'Benutzer existiert bereits' });
  }
  
  // Get admin's company
  const adminUser = users.find(u => u.email === adminEmail);
  const adminCompany = adminUser?.company || 'Unknown Company';
  
  // Create new user
  const newUser = {
    email: targetEmail,
    name: `${firstName} ${lastName}`,
    company: adminCompany,
    createdAt: new Date().toISOString(),
    createdBy: adminEmail
  };
  
  users.push(newUser);
  
  // Set global permissions for the user
  if (permissions && Object.keys(permissions).length > 0) {
    perms.globalPermissions[targetEmail] = {
      role: 'employee',
      permissions: permissions
    };
  }
  
  // Save changes
  if (writeUsers(users) && writePermissions(perms)) {
    return res.json({ success: true, user: newUser });
  }
  
  return res.status(500).json({ error: 'Benutzer konnte nicht erstellt werden' });
});

// Invite user to entity
app.post('/api/permissions/invite', (req, res) => {
  const { adminEmail, targetEmail, entityId, permissions } = req.body;
  
  if (!adminEmail || !targetEmail || !entityId || !permissions) {
    return res.status(400).json({ error: 'Fehlende Parameter' });
  }
  
  const perms = readPermissions();
  const entitaeten = readEntitaeten();
  
  // Check if admin is Geschäftsführer or entity manager
  const isGeschaeftsfuehrer = perms.globalPermissions[adminEmail]?.role === 'geschaeftsfuehrer';
  const entity = entitaeten.find(e => e.id === entityId);
  // Support both single manager and array of managers
  const entityManagers = entity?.managers || (entity?.manager ? [entity.manager] : []);
  const isEntityManager = entity && entityManagers.includes(adminEmail);
  
  if (!isGeschaeftsfuehrer && !isEntityManager) {
    return res.status(403).json({ error: 'Keine Berechtigung für diese Entität' });
  }
  
  const invitation = {
    id: Date.now().toString(),
    from: adminEmail,
    to: targetEmail,
    entityId,
    permissions,
    created: new Date().toISOString(),
    status: 'pending'
  };
  
  perms.invitations.push(invitation);
  
  if (writePermissions(perms)) {
    return res.json({ success: true, invitation });
  }
  
  return res.status(500).json({ error: 'Einladung konnte nicht gespeichert werden' });
});

// Remove permissions
app.delete('/api/permissions/:type/:email', (req, res) => {
  const { type, email } = req.params;
  const { adminEmail, entityId } = req.query;
  
  if (!adminEmail) {
    return res.status(400).json({ error: 'Admin-E-Mail fehlt' });
  }
  
  const perms = readPermissions();
  
  // Check if admin is Geschäftsführer
  const isGeschaeftsfuehrer = perms.globalPermissions[adminEmail]?.role === 'geschaeftsfuehrer';
  
  if (type === 'global') {
    if (!isGeschaeftsfuehrer) {
      return res.status(403).json({ error: 'Nur Geschäftsführer können globale Berechtigungen entfernen' });
    }
    delete perms.globalPermissions[email];
  } else if (type === 'entity' && entityId) {
    const entitaeten = readEntitaeten();
    const entity = entitaeten.find(e => e.id === entityId);
    // Support both single manager and array of managers
    const entityManagers = entity?.managers || (entity?.manager ? [entity.manager] : []);
    const isEntityManager = entity && entityManagers.includes(adminEmail);
    
    if (!isGeschaeftsfuehrer && !isEntityManager) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Entität' });
    }
    
    if (perms.entityPermissions[entityId]) {
      delete perms.entityPermissions[entityId][email];
    }
  }
  
  if (writePermissions(perms)) {
    return res.json({ success: true });
  }
  
  return res.status(500).json({ error: 'Berechtigungen konnten nicht entfernt werden' });
});

// Entitäten API - Filter by user (each user sees only their own entities, GF sees all from his company)
app.get('/api/entitaeten', (req, res) => {
  const { email } = req.query;
  const allEntitaeten = readEntitaeten();
  
  if (!email) {
    // No email = return all (for backwards compatibility)
    return res.json({ entitaeten: allEntitaeten });
  }
  
  // Helper function to check if user is manager of entity (supports both single manager and array)
  const isManagerOfEntity = (entity, userEmail) => {
    const managers = entity.managers || (entity.manager ? [entity.manager] : []);
    return managers.includes(userEmail);
  };
  
  // Check if user is Geschäftsführer
  const perms = readPermissions();
  const isGeschaeftsfuehrer = perms.globalPermissions[email]?.role === 'geschaeftsfuehrer';
  
  if (isGeschaeftsfuehrer) {
    // GF sees all entities where he is a manager OR users he invited (same company) are managers
    const users = readUsers();
    const currentUser = users.find(u => u.email === email);
    const companyUsers = users.filter(u => u.company === currentUser?.company).map(u => u.email);
    
    const companyEntities = allEntitaeten.filter(e => {
      const entityManagers = e.managers || (e.manager ? [e.manager] : []);
      return entityManagers.some(m => companyUsers.includes(m));
    });
    return res.json({ entitaeten: companyEntities });
  }
  
  // Regular users see entities where they are a manager (supports multi-manager)
  const userEntities = allEntitaeten.filter(e => isManagerOfEntity(e, email));
  
  // Also include entities where user has explicit entity permissions
  const entitiesWithAccess = [];
  Object.keys(perms.entityPermissions || {}).forEach(entityId => {
    if (perms.entityPermissions[entityId]?.[email]) {
      const entity = allEntitaeten.find(ent => ent.id === entityId);
      if (entity && !userEntities.find(ue => ue.id === entityId)) {
        entitiesWithAccess.push(entity);
      }
    }
  });
  
  return res.json({ entitaeten: [...userEntities, ...entitiesWithAccess] });
});

app.post('/api/entitaeten', (req, res) => {
  const { name, manager, managers, type } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name fehlt' });
  }
  
  // Support both single manager and array of managers
  let entityManagers = [];
  if (managers && Array.isArray(managers)) {
    entityManagers = managers;
  } else if (manager) {
    entityManagers = [manager];
  }
  
  if (entityManagers.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Manager erforderlich' });
  }
  
  const entitaeten = readEntitaeten();
  const newEntity = {
    id: Date.now().toString(),
    name,
    managers: entityManagers, // Array of managers/Geschäftsführer
    manager: entityManagers[0], // Keep for backwards compatibility
    type: type || 'standard',
    created: new Date().toISOString()
  };
  
  entitaeten.push(newEntity);
  
  if (writeEntitaeten(entitaeten)) {
    return res.status(201).json({ entity: newEntity });
  }
  
  return res.status(500).json({ error: 'Entität konnte nicht gespeichert werden' });
});

app.put('/api/entitaeten/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, manager, managers, taxId, address, currency, fiscalYear, notes, category } = req.body;
  
  let entitaeten = readEntitaeten();
  const index = entitaeten.findIndex(e => e.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Entität nicht gefunden' });
  }
  
  // Handle managers array (support both old single manager and new multi-manager)
  let updatedManagers = entitaeten[index].managers || (entitaeten[index].manager ? [entitaeten[index].manager] : []);
  if (managers && Array.isArray(managers)) {
    updatedManagers = managers;
  } else if (manager && !updatedManagers.includes(manager)) {
    // If single manager is passed and not in list, add it
    updatedManagers.push(manager);
  }
  
  // Update entity keeping existing fields
  entitaeten[index] = {
    ...entitaeten[index],
    name: name || entitaeten[index].name,
    type: type || entitaeten[index].type,
    managers: updatedManagers,
    manager: updatedManagers[0] || entitaeten[index].manager, // Keep for backwards compatibility
    taxId: taxId !== undefined ? taxId : entitaeten[index].taxId,
    address: address !== undefined ? address : entitaeten[index].address,
    currency: currency || entitaeten[index].currency,
    fiscalYear: fiscalYear || entitaeten[index].fiscalYear,
    notes: notes !== undefined ? notes : entitaeten[index].notes,
    category: category || entitaeten[index].category,
    updated: new Date().toISOString()
  };
  
  if (writeEntitaeten(entitaeten)) {
    return res.json({ entity: entitaeten[index] });
  }
  
  return res.status(500).json({ error: 'Entität konnte nicht aktualisiert werden' });
});

app.delete('/api/entitaeten/:id', (req, res) => {
  const { id } = req.params;
  let entitaeten = readEntitaeten();
  
  entitaeten = entitaeten.filter(e => e.id !== id);
  
  if (writeEntitaeten(entitaeten)) {
    // Also remove entity permissions
    const perms = readPermissions();
    delete perms.entityPermissions[id];
    writePermissions(perms);
    
    return res.json({ success: true });
  }
  
  return res.status(500).json({ error: 'Entität konnte nicht gelöscht werden' });
});

// Serve SPA: für alle anderen (nicht-API) Pfade, liefere index.html
app.get(/^\/(?!api|landing).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Kontiq Server gestartet auf http://localhost:${PORT}`);
});