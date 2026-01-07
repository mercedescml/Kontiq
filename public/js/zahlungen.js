/**
 * Sauvegarde un paiement depuis le formulaire (create or update)
 */
async function savePayment(event) {
  event.preventDefault();

  const id = document.getElementById('paymentId')?.value;
  const recipient = document.getElementById('paymentRecipient').value.trim();
  const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
  const date = document.getElementById('paymentDate').value;
  const status = document.getElementById('paymentStatus').value || 'pending';
  const description = document.getElementById('paymentDescription')?.value || '';

  if (!recipient || !date) {
    APP.notify('Alle Felder sind erforderlich', 'error');
    return;
  }

  const data = { recipient, amount, date, status, description };

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
    loadPayments();
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

/**
 * Charge tous les paiements - avec cache
 */
async function loadPayments() {
  try {
    // Utiliser le cache si disponible pour affichage instantané
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('zahlungen')) {
      data = DataPreloader.cache.get('zahlungen');
    } else {
      data = await API.zahlungen.getAll();
    }
    currentPayments = data.zahlungen || [];
    displayPayments(currentPayments);
  } catch (error) {
    APP.notify('Fehler beim Laden der Zahlungen', 'error');
    console.error(error);
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
  html += '<th style="text-align: left; padding: 10px;">Status</th>';
  html += '<th style="text-align: left; padding: 10px;">Aktion</th>';
  html += '</tr></thead><tbody>';

  payments.forEach(payment => {
    const statusColor = {
      'pending': '#F59E0B',
      'completed': '#10B981',
      'failed': '#EF4444'
    }[payment.status] || '#6B7280';

    html += `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px;">${payment.date || '-'}</td>
        <td style="padding: 10px;">${payment.recipient || '-'}</td>
        <td style="padding: 10px;">CHF ${payment.amount?.toFixed(2) || '0.00'}</td>
        <td style="padding: 10px;"><span style="color: ${statusColor}; font-weight: 600;">${payment.status}</span></td>
        <td style="padding: 10px;">
          <button class="btn btn-secondary" onclick="editPayment('${payment.id}')" style="padding: 5px 10px; font-size: 12px;">Bearbeiten</button>
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
  const statusField = document.getElementById('paymentStatus');
  const descriptionField = document.getElementById('paymentDescription');

  if (idField) idField.value = payment.id;
  if (recipientField) recipientField.value = payment.recipient || '';
  if (amountField) amountField.value = payment.amount || '';
  if (dateField) dateField.value = payment.date || '';
  if (statusField) statusField.value = payment.status || 'pending';
  if (descriptionField) descriptionField.value = payment.description || '';

  // Update modal title
  const modalTitle = document.querySelector('#paymentModal .modal-title');
  if (modalTitle) modalTitle.textContent = 'Zahlung bearbeiten';

  // Show modal
  modal.style.display = 'flex';
  if (recipientField) recipientField.focus();
}

/**
 * Creates payment modal if it doesn't exist
 */
function createPaymentModal() {
  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 class="modal-title" style="margin: 0 0 20px 0;">Zahlung bearbeiten</h3>
      <form onsubmit="savePayment(event)">
        <input type="hidden" id="paymentId">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Empfänger</label>
          <input type="text" id="paymentRecipient" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Betrag</label>
          <input type="number" id="paymentAmount" step="0.01" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Datum</label>
          <input type="date" id="paymentDate" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Status</label>
          <select id="paymentStatus" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <option value="pending">Ausstehend</option>
            <option value="completed">Abgeschlossen</option>
            <option value="failed">Fehlgeschlagen</option>
          </select>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Beschreibung</label>
          <textarea id="paymentDescription" rows="3" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;"></textarea>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closePaymentModal()" style="padding: 10px 20px; border: 1px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer;">Abbrechen</button>
          <button type="submit" style="padding: 10px 20px; background: #0EB17A; color: white; border: none; border-radius: 8px; cursor: pointer;">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

/**
 * Closes payment modal
 */
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.style.display = 'none';

  // Reset form
  const form = modal?.querySelector('form');
  if (form) form.reset();

  const idField = document.getElementById('paymentId');
  if (idField) idField.value = '';
}

/**
 * Ajoute un nouveau paiement
 */
async function addPayment(paymentData) {
  try {
    const result = await API.zahlungen.create(paymentData);
    APP.notify('Zahlung erstellt', 'success');
    loadPayments();
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
    loadPayments();
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
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Zahlungen page loaded');
  loadPayments();
});
