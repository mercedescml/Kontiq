/**
 * Sauvegarde un paiement depuis le formulaire (create or update)
 */
async function savePayment(event) {
  event.preventDefault();

  const id = document.getElementById('paymentId')?.value;
  const supplier = document.getElementById('paymentRecipient').value.trim();
  const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
  const date = document.getElementById('paymentDate').value;
  const due_date = document.getElementById('paymentDueDate')?.value || date;
  const status = document.getElementById('paymentStatus').value || 'pending';
  const description = document.getElementById('paymentDescription')?.value || '';
  const category = document.getElementById('paymentCategory')?.value || null;
  const skonto = parseFloat(document.getElementById('paymentSkonto')?.value) || 0;
  const skonto_deadline = document.getElementById('paymentSkontoDeadline')?.value || null;

  if (!supplier || !date) {
    APP.notify('Alle Felder sind erforderlich', 'error');
    return;
  }

  const data = {
    supplier,
    amount,
    date,
    due_date,
    status,
    description,
    category,
    skonto,
    skonto_deadline
  };

  try {
    if (id) {
      // Update existing payment
      await API.zahlungen.update(id, data);
      APP.notify('Zahlung aktualisiert', 'success');
    } else {
      // Create new payment
      await API.zahlungen.create(data);
      APP.notify('Zahlung erstellt', 'success');
    }

    closePaymentModal && closePaymentModal();
    loadZahlungen();
  } catch (error) {
    APP.notify('Fehler beim Speichern der Zahlung', 'error');
    console.error(error);
  }
}
/**
 * zahlungen.js - Gestion de la page Paiements
 * OPTIMISÉ avec cache pour affichage instantané
 */

let currentPayments = [];
let zahlungenKategorien = [];

/**
 * Charge tous les paiements - avec cache (using generic helper)
 */
async function loadZahlungen() {
  // Load kategorien first if not loaded
  if (zahlungenKategorien.length === 0) {
    await loadZahlungenKategorien();
  }

  currentPayments = await loadDataWithCache('zahlungen', displayPayments, 'zahlungen');
}

/**
 * Load payment categories
 */
async function loadZahlungenKategorien() {
  try {
    const response = await fetch('/api/zahlungen-kategorien');
    if (!response.ok) throw new Error('Fehler beim Laden der Kategorien');
    zahlungenKategorien = await response.json();
  } catch (error) {
    console.error('Error loading zahlungen kategorien:', error);
    zahlungenKategorien = [];
  }
}

/**
 * Affiche les paiements
 */
function displayPayments(payments) {
  const container = document.querySelector('.payments-list') || 
                   document.querySelector('[data-payments-container]');
  
  if (!container) return;

  if (payments.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Zahlungen gefunden</p>';
    return;
  }

  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr style="border-bottom: 2px solid #E5E7EB;">';
  html += '<th style="text-align: left; padding: 10px;">Datum</th>';
  html += '<th style="text-align: left; padding: 10px;">Empfänger</th>';
  html += '<th style="text-align: left; padding: 10px;">Betrag</th>';
  html += '<th style="text-align: left; padding: 10px;">Kategorie</th>';
  html += '<th style="text-align: left; padding: 10px;">Status</th>';
  html += '<th style="text-align: left; padding: 10px;">Aktion</th>';
  html += '</tr></thead><tbody>';

  payments.forEach(payment => {
    const statusColor = {
      'pending': '#F59E0B',
      'completed': '#10B981',
      'failed': '#EF4444'
    }[payment.status] || '#6B7280';

    // Get category name
    const kategorie = zahlungenKategorien.find(k => k.id === payment.category);
    const kategorieName = kategorie ? kategorie.name : '-';
    const kategorieColor = kategorie ? kategorie.color : '#9e9e9e';

    html += `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px;">${payment.date || '-'}</td>
        <td style="padding: 10px;">${payment.supplier || '-'}</td>
        <td style="padding: 10px;">CHF ${payment.amount?.toFixed(2) || '0.00'}</td>
        <td style="padding: 10px;">
          <span style="background: ${kategorieColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
            ${kategorieName}
          </span>
        </td>
        <td style="padding: 10px;"><span style="color: ${statusColor}; font-weight: 600;">${payment.status}</span></td>
        <td style="padding: 10px; display: flex; gap: 5px;">
          <button class="btn btn-secondary" onclick="editPayment('${payment.id}')" style="padding: 5px 10px; font-size: 12px;">Bearbeiten</button>
          ${payment.status === 'pending' ? `
            <button class="btn btn-primary" onclick="openVerschieben('${payment.id}')" style="padding: 5px 10px; font-size: 12px; background: #F59E0B;">Verschieben</button>
          ` : ''}
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Édite un paiement - opens modal with existing data
 */
async function editPayment(id) {
  const payment = currentPayments.find(p => p.id === id);
  if (!payment) {
    APP.notify('Zahlung nicht gefunden', 'error');
    return;
  }

  // Find or create modal
  let modal = document.getElementById('paymentModal');
  if (!modal) {
    console.warn('Payment modal not found, creating basic modal');
    modal = createPaymentModal();
  }

  // Fill form with payment data
  const idField = document.getElementById('paymentId');
  const recipientField = document.getElementById('paymentRecipient');
  const amountField = document.getElementById('paymentAmount');
  const dateField = document.getElementById('paymentDate');
  const dueDateField = document.getElementById('paymentDueDate');
  const statusField = document.getElementById('paymentStatus');
  const descriptionField = document.getElementById('paymentDescription');
  const categoryField = document.getElementById('paymentCategory');
  const skontoField = document.getElementById('paymentSkonto');
  const skontoDeadlineField = document.getElementById('paymentSkontoDeadline');

  if (idField) idField.value = payment.id;
  if (recipientField) recipientField.value = payment.supplier || '';
  if (amountField) amountField.value = payment.amount || '';
  if (dateField) dateField.value = payment.date || '';
  if (dueDateField) dueDateField.value = payment.due_date || payment.date || '';
  if (statusField) statusField.value = payment.status || 'pending';
  if (descriptionField) descriptionField.value = payment.description || '';
  if (categoryField) categoryField.value = payment.category || '';
  if (skontoField) skontoField.value = payment.skonto || '';
  if (skontoDeadlineField) skontoDeadlineField.value = payment.skonto_deadline || '';

  // Update modal title
  const modalTitle = document.querySelector('#paymentModal .modal-title');
  if (modalTitle) modalTitle.textContent = 'Zahlung bearbeiten';

  // Show modal
  modal.style.display = 'flex';
  if (recipientField) recipientField.focus();
}

/**
 * Creates payment modal if it doesn't exist (using generic helper)
 */
function createPaymentModal() {
  // Build category options dynamically
  const categoryOptions = [{ value: '', label: 'Keine Kategorie' }].concat(
    zahlungenKategorien.map(k => ({ value: k.id, label: k.name }))
  );

  return createGenericModal({
    id: 'paymentModal',
    title: 'Zahlung bearbeiten',
    idFieldName: 'paymentId',
    maxWidth: '600px',
    singleColumn: false,
    fields: [
      { id: 'paymentRecipient', label: 'Empfänger', type: 'text', required: true, fullWidth: true },
      { id: 'paymentAmount', label: 'Betrag', type: 'number', step: '0.01', required: true },
      { id: 'paymentCategory', label: 'Kategorie', type: 'select', options: categoryOptions },
      { id: 'paymentDate', label: 'Datum', type: 'date', required: true },
      { id: 'paymentDueDate', label: 'Fälligkeitsdatum', type: 'date' },
      { id: 'paymentSkonto', label: 'Skonto (%)', type: 'number', step: '0.1', min: 0, max: 100, placeholder: 'z.B. 2' },
      { id: 'paymentSkontoDeadline', label: 'Skonto-Frist', type: 'date' },
      {
        id: 'paymentStatus',
        label: 'Status',
        type: 'select',
        fullWidth: true,
        options: [
          { value: 'pending', label: 'Ausstehend' },
          { value: 'completed', label: 'Abgeschlossen' },
          { value: 'failed', label: 'Fehlgeschlagen' }
        ]
      },
      { id: 'paymentDescription', label: 'Beschreibung', type: 'textarea', rows: 3, fullWidth: true }
    ],
    onSubmit: 'savePayment',
    onClose: 'closePaymentModal'
  });
}

/**
 * Closes payment modal (using generic helper)
 */
function closePaymentModal() {
  closeGenericModal('paymentModal', 'paymentId');
}

/**
 * Ajoute un nouveau paiement
 */
async function addPayment(paymentData) {
  try {
    const result = await API.zahlungen.create(paymentData);
    APP.notify('Zahlung erstellt', 'success');
    loadZahlungen();
  } catch (error) {
    APP.notify('Fehler beim Erstellen der Zahlung', 'error');
    console.error(error);
  }
}

/**
 * Supprime un paiement
 */
async function deletePayment(id) {
  const confirmed = await APP.confirm('Wollen Sie diese Zahlung löschen?');
  if (!confirmed) return;

  try {
    await API.zahlungen.delete(id);
    APP.notify('Zahlung gelöscht', 'success');
    loadZahlungen();
  } catch (error) {
    APP.notify('Fehler beim Löschen der Zahlung', 'error');
    console.error(error);
  }
}

/**
 * Filtrer les paiements
 */
function filterPayments(status) {
  if (status === 'all') {
    displayPayments(currentPayments);
  } else {
    const filtered = currentPayments.filter(p => p.status === status);
    displayPayments(filtered);
  }
}

/**
 * Open Zahlungsaufschieb Simulator for single payment
 */
function openVerschieben(paymentId) {
  const payment = currentPayments.find(p => p.id === paymentId);
  if (!payment) {
    APP.notify('Zahlung nicht gefunden', 'error');
    return;
  }

  // Ensure payment has required fields for simulator
  const paymentForSimulator = {
    ...payment,
    due_date: payment.due_date || payment.date,
    supplier: payment.supplier,
    description: payment.description || payment.supplier
  };

  // Use the global zahlungsSimulator from zahlungsaufschieb-simulator.js
  if (typeof zahlungsSimulator !== 'undefined') {
    zahlungsSimulator.openSingle(paymentForSimulator);
  } else {
    console.error('Zahlungsaufschieb-Simulator not loaded');
    APP.notify('Simulator nicht verfügbar', 'error');
  }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Zahlungen page loaded');
  loadZahlungen();
});
