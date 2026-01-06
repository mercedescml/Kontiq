/**
 * ROUTES API À AJOUTER À server.js
 * 
 * Copier-coller ces routes dans server.js après les routes existantes
 * et avant le "app.get(/^\\/(?!api).*\\/" final"
 */

// ========== DEMO BOOKINGS (RÉSERVATIONS DE DÉMO) ==========
app.get('/api/bookings', (req, res) => {
  const bookings = readBookings();
  res.json({ bookings });
});

app.post('/api/bookings', (req, res) => {
  const { firstName, lastName, email, company, employees, package: pkg, message } = req.body;
  if (!firstName || !lastName || !email || !company) {
    return res.status(400).json({ error: 'Informations manquantes' });
  }
  const bookings = readBookings();
  const booking = {
    id: Date.now().toString(),
    firstName, lastName, email, company, employees, package: pkg, message,
    status: 'pending',
    created: new Date().toISOString()
  };
  bookings.push(booking);
  if (writeBookings(bookings)) {
    return res.status(201).json({ booking });
  }
  return res.status(500).json({ error: 'Réservation ne peut pas être sauvegardée' });
});

// ========== CONTRACTS (VERTRÄGE) ==========
app.get('/api/contracts', (req, res) => {
  const contracts = readContracts();
  res.json({ contracts });
});

app.post('/api/contracts', (req, res) => {
  const { name, partner, startDate, endDate, amount, status, description } = req.body;
  const contracts = readContracts();
  const contract = {
    id: Date.now().toString(),
    name, partner, startDate, endDate, amount, status, description,
    created: new Date().toISOString()
  };
  contracts.push(contract);
  if (writeContracts(contracts)) {
    return res.status(201).json({ contract });
  }
  return res.status(500).json({ error: 'Contract konnte nicht gespeichert werden' });
});

app.put('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  const contracts = readContracts();
  const index = contracts.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Contract nicht gefunden' });
  contracts[index] = { ...contracts[index], ...req.body };
  if (writeContracts(contracts)) {
    return res.json({ contract: contracts[index] });
  }
  return res.status(500).json({ error: 'Contract konnte nicht aktualisiert werden' });
});

app.delete('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  let contracts = readContracts();
  if (!contracts.find(c => c.id === id)) {
    return res.status(404).json({ error: 'Contract nicht gefunden' });
  }
  contracts = contracts.filter(c => c.id !== id);
  if (writeContracts(contracts)) {
    return res.json({ contracts });
  }
  return res.status(500).json({ error: 'Contract konnte nicht gelöscht werden' });
});

// ========== ZAHLUNGEN (PAYMENTS) ==========
app.get('/api/zahlungen', (req, res) => {
  const zahlungen = readZahlungen();
  res.json({ zahlungen });
});

app.post('/api/zahlungen', (req, res) => {
  const { date, recipient, amount, status } = req.body;
  const zahlungen = readZahlungen();
  const zahlung = {
    id: Date.now().toString(),
    date, recipient, amount, status,
    created: new Date().toISOString()
  };
  zahlungen.push(zahlung);
  if (writeZahlungen(zahlungen)) {
    return res.status(201).json({ zahlung });
  }
  return res.status(500).json({ error: 'Zahlung konnte nicht gespeichert werden' });
});

app.put('/api/zahlungen/:id', (req, res) => {
  const { id } = req.params;
  const zahlungen = readZahlungen();
  const index = zahlungen.findIndex(z => z.id === id);
  if (index === -1) return res.status(404).json({ error: 'Zahlung nicht gefunden' });
  zahlungen[index] = { ...zahlungen[index], ...req.body };
  if (writeZahlungen(zahlungen)) {
    return res.json({ zahlung: zahlungen[index] });
  }
  return res.status(500).json({ error: 'Zahlung konnte nicht aktualisiert werden' });
});

app.delete('/api/zahlungen/:id', (req, res) => {
  const { id } = req.params;
  let zahlungen = readZahlungen();
  if (!zahlungen.find(z => z.id === id)) {
    return res.status(404).json({ error: 'Zahlung nicht gefunden' });
  }
  zahlungen = zahlungen.filter(z => z.id !== id);
  if (writeZahlungen(zahlungen)) {
    return res.json({ zahlungen });
  }
  return res.status(500).json({ error: 'Zahlung konnte nicht gelöscht werden' });
});

// ========== BANKKONTEN (BANK ACCOUNTS) ==========
app.get('/api/bankkonten', (req, res) => {
  const bankkonten = readBankkonten();
  res.json({ bankkonten });
});

app.post('/api/bankkonten', (req, res) => {
  const { name, iban, bank, balance } = req.body;
  const bankkonten = readBankkonten();
  const konto = {
    id: Date.now().toString(),
    name, iban, bank, balance,
    created: new Date().toISOString()
  };
  bankkonten.push(konto);
  if (writeBankkonten(bankkonten)) {
    return res.status(201).json({ konto });
  }
  return res.status(500).json({ error: 'Bankkonto konnte nicht gespeichert werden' });
});

app.put('/api/bankkonten/:id', (req, res) => {
  const { id } = req.params;
  const bankkonten = readBankkonten();
  const index = bankkonten.findIndex(k => k.id === id);
  if (index === -1) return res.status(404).json({ error: 'Bankkonto nicht gefunden' });
  bankkonten[index] = { ...bankkonten[index], ...req.body };
  if (writeBankkonten(bankkonten)) {
    return res.json({ konto: bankkonten[index] });
  }
  return res.status(500).json({ error: 'Bankkonto konnte nicht aktualisiert werden' });
});

app.delete('/api/bankkonten/:id', (req, res) => {
  const { id } = req.params;
  let bankkonten = readBankkonten();
  if (!bankkonten.find(k => k.id === id)) {
    return res.status(404).json({ error: 'Bankkonto nicht gefunden' });
  }
  bankkonten = bankkonten.filter(k => k.id !== id);
  if (writeBankkonten(bankkonten)) {
    return res.json({ bankkonten });
  }
  return res.status(500).json({ error: 'Bankkonto konnte nicht gelöscht werden' });
});

// ========== KOSTEN (COSTS) ==========
app.get('/api/kosten', (req, res) => {
  const kosten = readKosten();
  res.json({ kosten });
});

app.post('/api/kosten', (req, res) => {
  const { category, description, amount, date } = req.body;
  const kosten = readKosten();
  const kost = {
    id: Date.now().toString(),
    category, description, amount, date,
    created: new Date().toISOString()
  };
  kosten.push(kost);
  if (writeKosten(kosten)) {
    return res.status(201).json({ kost });
  }
  return res.status(500).json({ error: 'Kosten konnten nicht gespeichert werden' });
});

app.delete('/api/kosten/:id', (req, res) => {
  const { id } = req.params;
  let kosten = readKosten();
  if (!kosten.find(k => k.id === id)) {
    return res.status(404).json({ error: 'Kosten nicht gefunden' });
  }
  kosten = kosten.filter(k => k.id !== id);
  if (writeKosten(kosten)) {
    return res.json({ kosten });
  }
  return res.status(500).json({ error: 'Kosten konnten nicht gelöscht werden' });
});

// ========== FORDERUNGEN (INVOICES) ==========
app.get('/api/forderungen', (req, res) => {
  const forderungen = readForderungen();
  res.json({ forderungen });
});

app.post('/api/forderungen', (req, res) => {
  const { customer, amount, dueDate, status } = req.body;
  const forderungen = readForderungen();
  const forderung = {
    id: Date.now().toString(),
    customer, amount, dueDate, status,
    created: new Date().toISOString()
  };
  forderungen.push(forderung);
  if (writeForderungen(forderungen)) {
    return res.status(201).json({ forderung });
  }
  return res.status(500).json({ error: 'Forderung konnte nicht gespeichert werden' });
});

// ========== EXPORT ==========
app.post('/api/export/pdf', (req, res) => {
  // À implémenter: générer PDF
  res.json({ ok: true, message: 'PDF export initiated' });
});

app.post('/api/export/excel', (req, res) => {
  // À implémenter: générer Excel
  res.json({ ok: true, message: 'Excel export initiated' });
});

// ========== CREDIT SIMULATOR ==========
app.post('/api/credit-simulator', (req, res) => {
  const { amount, interest, term } = req.body;
  const creditCost = (amount * interest * term) / (100 * 365);
  res.json({
    creditCost,
    amount,
    interest,
    term
  });
});

// ========== HELPER FUNCTIONS ==========
// Ajouter ces fonctions au début de server.js avec les autres read/write functions

const CONTRACTS_FILE = path.join(DATA_DIR, 'contracts.json');
const ZAHLUNGEN_FILE = path.join(DATA_DIR, 'zahlungen.json');
const BANKKONTEN_FILE = path.join(DATA_DIR, 'bankkonten.json');
const KOSTEN_FILE = path.join(DATA_DIR, 'kosten.json');
const FORDERUNGEN_FILE = path.join(DATA_DIR, 'forderungen.json');

function readContracts() {
  try {
    if (!fs.existsSync(CONTRACTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(CONTRACTS_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading contracts', e);
    return [];
  }
}

function writeContracts(data) {
  try {
    fs.writeFileSync(CONTRACTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing contracts', e);
    return false;
  }
}

function readZahlungen() {
  try {
    if (!fs.existsSync(ZAHLUNGEN_FILE)) return [];
    return JSON.parse(fs.readFileSync(ZAHLUNGEN_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading zahlungen', e);
    return [];
  }
}

function writeZahlungen(data) {
  try {
    fs.writeFileSync(ZAHLUNGEN_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing zahlungen', e);
    return false;
  }
}

function readBankkonten() {
  try {
    if (!fs.existsSync(BANKKONTEN_FILE)) return [];
    return JSON.parse(fs.readFileSync(BANKKONTEN_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading bankkonten', e);
    return [];
  }
}

function writeBankkonten(data) {
  try {
    fs.writeFileSync(BANKKONTEN_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing bankkonten', e);
    return false;
  }
}

function readKosten() {
  try {
    if (!fs.existsSync(KOSTEN_FILE)) return [];
    return JSON.parse(fs.readFileSync(KOSTEN_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading kosten', e);
    return [];
  }
}

function writeKosten(data) {
  try {
    fs.writeFileSync(KOSTEN_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing kosten', e);
    return false;
  }
}

function readForderungen() {
  try {
    if (!fs.existsSync(FORDERUNGEN_FILE)) return [];
    return JSON.parse(fs.readFileSync(FORDERUNGEN_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading forderungen', e);
    return [];
  }
}

function writeForderungen(data) {
  try {
    fs.writeFileSync(FORDERUNGEN_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing forderungen', e);
    return false;
  }
}

const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function readBookings() {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) return [];
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed reading bookings', e);
    return [];
  }
}

function writeBookings(data) {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed writing bookings', e);
    return false;
  }
}
