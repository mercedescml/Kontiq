/**
 * Sauvegarde un paiement depuis le formulaire
 */
async function savePayment(event) {
  event.preventDefault();
  const recipient = document.getElementById('paymentRecipient').value.trim();
  const amount = parseFloat(document.getElementById('paymentAmount').value) || 0;
  const date = document.getElementById('paymentDate').value;
  const status = document.getElementById('paymentStatus').value || 'pending';

  if (!recipient || !date) {
    APP.notify('Alle Felder sind erforderlich', 'error');
    return;
  }

  const data = { recipient, amount, date, status };
  try {
    await addPayment(data);
    APP.notify('Zahlung gespeichert', 'success');
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
 * Édite un paiement
 */
async function editPayment(id) {
  const payment = currentPayments.find(p => p.id === id);
  if (!payment) return;

  APP.notify(`Zahlung ${id} wird bearbeitet...`, 'info');
  // À implémenter: ouvrir une modal d'édition
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
