/**
 * Sauvegarde une créance depuis le formulaire (create or update)
 */
async function saveForderung(event) {
  event.preventDefault();

  const id = document.getElementById('forderungId')?.value;
  const customer = document.getElementById('forderungCustomer').value.trim();
  const amount = parseFloat(document.getElementById('forderungAmount').value) || 0;
  const dueDate = document.getElementById('forderungDueDate').value;
  const status = document.getElementById('forderungStatus').value || 'open';

  if (!customer || !dueDate) {
    APP.notify('Alle Felder sind erforderlich', 'error');
    return;
  }

  const data = { customer, amount, dueDate, status };

  try {
    if (id) {
      await API.forderungen.update(id, data);
      APP.notify('Forderung aktualisiert', 'success');
    } else {
      await API.forderungen.create(data);
      APP.notify('Forderung erstellt', 'success');
    }

    closeForderungModal && closeForderungModal();
    loadForderungen();
  } catch (error) {
    APP.notify('Fehler beim Speichern der Forderung', 'error');
    console.error(error);
  }
}
/**
 * forderungen.js - Gestion des Créances
 * OPTIMISÉ avec cache pour affichage instantané
 */

let currentForderungen = [];

/**
 * Charge tous les créances - avec cache
 */
async function loadForderungen() {
  try {
    // Utiliser le cache si disponible
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('forderungen')) {
      data = DataPreloader.cache.get('forderungen');
    } else {
      data = await API.forderungen.getAll();
    }
    currentForderungen = data.forderungen || [];
    displayForderungen(currentForderungen);
  } catch (error) {
    APP.notify('Fehler beim Laden der Forderungen', 'error');
    console.error(error);
  }
}

/**
 * Affiche les créances
 */
function displayForderungen(forderungen) {
  const container = document.querySelector('.forderungen-list') || 
                   document.querySelector('[data-forderungen-container]');
  
  if (!container) return;

  if (forderungen.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Forderungen gefunden</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
  
  forderungen.forEach(f => {
    const statusColor = {
      'open': '#F59E0B',
      'paid': '#10B981',
      'overdue': '#EF4444'
    }[f.status] || '#6B7280';

    html += `
      <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 10px 0; color: #0A2540;">${f.customer || 'Kunde'}</h4>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Betrag:</strong> CHF ${f.amount?.toFixed(2) || '0.00'}</p>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Fällig:</strong> ${f.dueDate || '-'}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${f.status}</span></p>
        <button class="btn btn-secondary" onclick="editForderung('${f.id}')" style="margin-top: 10px; width: 100%; padding: 8px;">Bearbeiten</button>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Edit forderung - opens modal with data
 */
async function editForderung(id) {
  const forderung = currentForderungen.find(f => f.id === id);
  if (!forderung) {
    APP.notify('Forderung nicht gefunden', 'error');
    return;
  }

  let modal = document.getElementById('forderungModal');
  if (!modal) {
    modal = createForderungModal();
  }

  const idField = document.getElementById('forderungId');
  const customerField = document.getElementById('forderungCustomer');
  const amountField = document.getElementById('forderungAmount');
  const dueDateField = document.getElementById('forderungDueDate');
  const statusField = document.getElementById('forderungStatus');

  if (idField) idField.value = forderung.id;
  if (customerField) customerField.value = forderung.customer || '';
  if (amountField) amountField.value = forderung.amount || '';
  if (dueDateField) dueDateField.value = forderung.dueDate || '';
  if (statusField) statusField.value = forderung.status || 'open';

  const modalTitle = modal.querySelector('.modal-title');
  if (modalTitle) modalTitle.textContent = 'Forderung bearbeiten';

  modal.style.display = 'flex';
  if (customerField) customerField.focus();
}

function createForderungModal() {
  const modal = document.createElement('div');
  modal.id = 'forderungModal';
  modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 class="modal-title">Forderung bearbeiten</h3>
      <form onsubmit="saveForderung(event)">
        <input type="hidden" id="forderungId">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Kunde</label>
          <input type="text" id="forderungCustomer" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Betrag</label>
          <input type="number" id="forderungAmount" step="0.01" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Fälligkeitsdatum</label>
          <input type="date" id="forderungDueDate" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Status</label>
          <select id="forderungStatus" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <option value="open">Offen</option>
            <option value="paid">Bezahlt</option>
            <option value="overdue">Überfällig</option>
          </select>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closeForderungModal()" style="padding: 10px 20px; border: 1px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer;">Abbrechen</button>
          <button type="submit" style="padding: 10px 20px; background: #0EB17A; color: white; border: none; border-radius: 8px; cursor: pointer;">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function closeForderungModal() {
  const modal = document.getElementById('forderungModal');
  if (modal) modal.style.display = 'none';
  const form = modal?.querySelector('form');
  if (form) form.reset();
  const idField = document.getElementById('forderungId');
  if (idField) idField.value = '';
}

/**
 * Ajoute un créance
 */
async function addForderung(data) {
  try {
    const result = await API.forderungen.create(data);
    APP.notify('Forderung erstellt', 'success');
    loadForderungen();
  } catch (error) {
    APP.notify('Fehler beim Erstellen der Forderung', 'error');
    console.error(error);
  }
}

/**
 * Filtrer par statut
 */
function filterForderungen(status) {
  if (status === 'all') {
    displayForderungen(currentForderungen);
  } else {
    const filtered = currentForderungen.filter(f => f.status === status);
    displayForderungen(filtered);
  }
}

/**
 * Forderungen page modal handlers - for forderungen.html buttons
 */

// Create Invoice Modal
function openCreateInvoice() {
  const modal = document.getElementById('createInvoiceModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    APP.notify('Modal nicht gefunden', 'warning');
  }
}

function closeCreateInvoice() {
  const modal = document.getElementById('createInvoiceModal');
  if (modal) {
    modal.classList.remove('active');
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Edit Invoice Modal
function editInvoice(invoiceId) {
  const modal = document.getElementById('editInvoiceModal');
  if (modal) {
    modal.classList.add('active');
    // In real app, would load invoice data here
    console.log('Editing invoice:', invoiceId);
  } else {
    APP.notify('Modal nicht gefunden', 'warning');
  }
}

function closeEditInvoice() {
  const modal = document.getElementById('editInvoiceModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Reminder/Mahnung Modal
function openReminder(client) {
  const modal = document.getElementById('reminderModal');
  if (modal) {
    modal.classList.add('active');
    console.log('Opening reminder for:', client);
  } else {
    APP.notify('Modal nicht gefunden', 'warning');
  }
}

function closeReminder() {
  const modal = document.getElementById('reminderModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Import Modal
function openImport() {
  const modal = document.getElementById('importModal');
  if (modal) {
    modal.classList.add('active');
  } else {
    APP.notify('Modal nicht gefunden', 'warning');
  }
}

function closeImport() {
  const modal = document.getElementById('importModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Import type selection
function selectImport(type) {
  // Remove active class from all import methods
  document.querySelectorAll('.import-method').forEach(el => el.classList.remove('active'));

  // Add active to clicked one
  if (event && event.target) {
    const method = event.target.closest('.import-method');
    if (method) method.classList.add('active');
  }

  // Show/hide appropriate import sections
  const pdfImport = document.getElementById('pdfImport');
  const excelImport = document.getElementById('excelImport');
  const datevImport = document.getElementById('datevImport');

  if (pdfImport) pdfImport.style.display = type === 'pdf' ? 'block' : 'none';
  if (excelImport) excelImport.style.display = type === 'excel' ? 'block' : 'none';
  if (datevImport) datevImport.style.display = type === 'datev' ? 'block' : 'none';
}

// Mahnung calculation update
function updateMahnungCalculation() {
  const type = document.getElementById('reminderType')?.value || '';
  const calc = document.getElementById('mahnungCalc');

  if (calc) {
    if (type.includes('Mahnung')) {
      calc.style.display = 'block';
    } else {
      calc.style.display = 'none';
    }
  }
}

// Save invoice changes
function saveInvoiceChanges() {
  // In real app, would save via API
  APP.notify('Änderungen gespeichert', 'success');
  closeEditInvoice();

  // Reload data
  loadForderungen();
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Forderungen page loaded');
  loadForderungen();
});
