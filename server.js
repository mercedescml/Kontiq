const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd || '').digest('hex');

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
app.post('/api/zahlungen', (req, res) => {
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
app.post('/api/contracts', (req, res) => {
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
app.post('/api/kosten', (req, res) => {
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
app.post('/api/forderungen', (req, res) => {
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
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name fehlt' });
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
app.post('/api/users/register', (req, res) => {
  const { email, password, name, company } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-Mail oder Passwort fehlt' });
  const users = readJSON(FILES.users);
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Benutzer existiert bereits' });
  const user = { email, name: name || '', company: company || '', passwordHash: hashPassword(password), created: new Date().toISOString() };
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
});
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-Mail oder Passwort fehlt' });
  const users = readJSON(FILES.users);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  if (user.passwordHash !== hashPassword(password)) return res.status(401).json({ error: 'Falsches Passwort' });
  res.json({ user: { email: user.email, name: user.name, company: user.company } });
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
app.post('/api/entitaeten', (req, res) => {
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

// KPIs, Reports, Export (stubs)
app.get('/api/kpis', (req, res) => res.json({ kpis: { revenue: 0, expenses: 0, profit: 0 } }));
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
