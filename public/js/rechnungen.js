/**
 * Rechnungen - Gestion des Factures
 * Module de gestion centralisée des factures reçues et envoyées
 */

let allFactures = [];
let currentTab = 'received';

/**
 * Charge toutes les factures au chargement de la page
 */
async function loadRechnungen() {
  try {
    const response = await fetch('/api/factures', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Ladefehler');

    const data = await response.json();
    allFactures = data.factures || [];

    // Charger les factures selon l'onglet actif
    displayReceivedInvoices(allFactures.filter(f => f.type === 'received'));
    displaySentInvoices(allFactures.filter(f => f.type === 'sent'));

    // Mettre à jour les statistiques
    updateStats();

    // Remplir les filtres
    populateFilters();
  } catch (error) {
    console.error('Fehler:', error);
    APP.notify && APP.notify('Fehler beim Laden der Rechnungen', 'error');
  }
}

/**
 * Affiche les factures reçues
 */
function displayReceivedInvoices(factures) {
  const container = document.getElementById('received-invoices-list');
  if (!container) return;

  if (factures.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">Keine Rechnungen empfangen</div>
        <div class="empty-state-subtext">Lieferantenrechnungen werden hier angezeigt</div>
      </div>
    `;
    return;
  }

  let html = '';
  factures.forEach(facture => {
    const dueDate = new Date(facture.due_date);
    const isOverdue = dueDate < new Date() && facture.status !== 'paid';

    html += `
      <div class="invoice-row received ${isOverdue ? 'overdue' : ''}">
        <div class="invoice-number">${facture.invoice_number}</div>
        <div class="supplier-name">
          ${facture.supplier_name}
          <span class="supplier-email">${facture.supplier_email || ''}</span>
        </div>
        <div class="invoice-date">${formatDate(facture.date)}</div>
        <div class="invoice-date">${formatDate(facture.due_date)}</div>
        <div class="invoice-amount">CHF ${facture.total.toFixed(2)}</div>
        <div>
          <span class="invoice-category">${facture.category || 'Non catégorisé'}</span>
        </div>
        <div>
          <span class="status-badge status-${facture.status}">${getStatusLabel(facture.status)}</span>
        </div>
        <div class="invoice-actions">
          <button class="btn-icon btn-view" title="Ansehen" onclick="viewInvoice('${facture.id}')">Ansehen</button>
          <button class="btn-icon btn-download" title="Herunterladen" onclick="downloadInvoice('${facture.id}')">PDF</button>
          ${facture.status === 'pending' ? `
            <button class="btn-icon btn-approve" title="Genehmigen" onclick="approveInvoice('${facture.id}')">OK</button>
          ` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Affiche les factures envoyées
 */
function displaySentInvoices(factures) {
  const container = document.getElementById('sent-invoices-list');
  if (!container) return;

  if (factures.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-text">Keine Rechnungen gesendet</div>
        <div class="empty-state-subtext">An Kunden gesendete Rechnungen werden hier angezeigt</div>
      </div>
    `;
    return;
  }

  let html = '';
  factures.forEach(facture => {
    html += `
      <div class="invoice-row sent">
        <div class="invoice-number">${facture.invoice_number}</div>
        <div class="client-name">
          ${facture.client_name}
          <span class="client-email">${facture.client_email || ''}</span>
        </div>
        <div class="invoice-date">${formatDate(facture.date)}</div>
        <div class="invoice-date">${formatDate(facture.due_date)}</div>
        <div class="invoice-amount">CHF ${facture.total.toFixed(2)}</div>
        <div>
          <span class="invoice-category">${facture.category || 'Service'}</span>
        </div>
        <div>
          <span class="status-badge status-${facture.status}">${getStatusLabel(facture.status)}</span>
        </div>
        <div class="invoice-actions">
          <button class="btn-icon btn-view" title="Ansehen" onclick="viewInvoice('${facture.id}')">Ansehen</button>
          <button class="btn-icon btn-download" title="PDF herunterladen" onclick="downloadInvoice('${facture.id}')">PDF</button>
          ${facture.portal_token ? `
            <button class="btn-icon" title="Kundenportal" onclick="openClientPortal('${facture.portal_token}')">Link</button>
          ` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Met à jour les statistiques
 */
function updateStats() {
  const receivedInvoices = allFactures.filter(f => f.type === 'received');
  const sentInvoices = allFactures.filter(f => f.type === 'sent');

  // Stats factures reçues
  document.getElementById('stat-received-total').textContent = receivedInvoices.length;
  document.getElementById('stat-received-pending').textContent =
    receivedInvoices.filter(f => f.status === 'pending').length;
  document.getElementById('stat-received-approved').textContent =
    receivedInvoices.filter(f => f.status === 'approved').length;
  document.getElementById('stat-received-paid').textContent =
    receivedInvoices.filter(f => f.status === 'paid').length;

  // Stats factures envoyées
  document.getElementById('stat-sent-total').textContent = sentInvoices.length;
  document.getElementById('stat-sent-sent').textContent =
    sentInvoices.filter(f => f.status === 'sent').length;

  const totalAmount = sentInvoices
    .filter(f => f.status === 'sent')
    .reduce((sum, f) => sum + (f.total || 0), 0);
  document.getElementById('stat-sent-amount').textContent = `CHF ${totalAmount.toFixed(2)}`;

  document.getElementById('stat-sent-paid').textContent =
    sentInvoices.filter(f => f.status === 'paid').length;
}

/**
 * Remplit les filtres avec les valeurs uniques
 */
function populateFilters() {
  const receivedInvoices = allFactures.filter(f => f.type === 'received');
  const sentInvoices = allFactures.filter(f => f.type === 'sent');

  // Fournisseurs uniques
  const suppliers = [...new Set(receivedInvoices.map(f => f.supplier_name))].sort();
  const supplierSelect = document.getElementById('filter-received-supplier');
  suppliers.forEach(supplier => {
    const option = document.createElement('option');
    option.value = supplier;
    option.textContent = supplier;
    supplierSelect.appendChild(option);
  });

  // Clients uniques
  const clients = [...new Set(sentInvoices.map(f => f.client_name))].sort();
  const clientSelect = document.getElementById('filter-sent-client');
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client;
    option.textContent = client;
    clientSelect.appendChild(option);
  });

  // Catégories uniques pour factures reçues
  const receivedCategories = [...new Set(receivedInvoices.map(f => f.category).filter(Boolean))].sort();
  const receivedCategorySelect = document.getElementById('filter-received-category');
  receivedCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    receivedCategorySelect.appendChild(option);
  });

  // Catégories uniques pour factures envoyées
  const sentCategories = [...new Set(sentInvoices.map(f => f.category).filter(Boolean))].sort();
  const sentCategorySelect = document.getElementById('filter-sent-category');
  sentCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    sentCategorySelect.appendChild(option);
  });
}

/**
 * Applique les filtres
 */
function applyFilters(type) {
  let factures = allFactures.filter(f => f.type === type);

  if (type === 'received') {
    const period = document.getElementById('filter-received-period').value;
    const supplier = document.getElementById('filter-received-supplier').value;
    const category = document.getElementById('filter-received-category').value;
    const status = document.getElementById('filter-received-status').value;

    if (supplier !== 'all') factures = factures.filter(f => f.supplier_name === supplier);
    if (category !== 'all') factures = factures.filter(f => f.category === category);
    if (status !== 'all') factures = factures.filter(f => f.status === status);

    factures = filterByPeriod(factures, period);
    displayReceivedInvoices(factures);
  } else {
    const period = document.getElementById('filter-sent-period').value;
    const client = document.getElementById('filter-sent-client').value;
    const category = document.getElementById('filter-sent-category').value;
    const status = document.getElementById('filter-sent-status').value;

    if (client !== 'all') factures = factures.filter(f => f.client_name === client);
    if (category !== 'all') factures = factures.filter(f => f.category === category);
    if (status !== 'all') factures = factures.filter(f => f.status === status);

    factures = filterByPeriod(factures, period);
    displaySentInvoices(factures);
  }
}

/**
 * Filtre par période
 */
function filterByPeriod(factures, period) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  switch (period) {
    case 'current-month':
      return factures.filter(f => {
        const date = new Date(f.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    case 'last-month':
      return factures.filter(f => {
        const date = new Date(f.date);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      });
    case 'current-year':
      return factures.filter(f => {
        const date = new Date(f.date);
        return date.getFullYear() === currentYear;
      });
    default:
      return factures;
  }
}

/**
 * Formate une date au format DD.MM.YYYY
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Retourne le label du statut
 */
function getStatusLabel(status) {
  const labels = {
    'pending': 'Ausstehend',
    'approved': 'Genehmigt',
    'paid': 'Bezahlt',
    'sent': 'Gesendet',
    'rejected': 'Abgelehnt'
  };
  return labels[status] || status;
}

/**
 * Voir une facture
 */
function viewInvoice(id) {
  const facture = allFactures.find(f => f.id === id);
  if (!facture) return;

  alert(`Details zur Rechnung ${facture.invoice_number}\n\n` +
        `Betrag: CHF ${facture.total.toFixed(2)}\n` +
        `Beschreibung: ${facture.description || 'N/A'}\n` +
        `Status: ${getStatusLabel(facture.status)}\n\n` +
        `Vollständige Ansichtsfunktion folgt in Kürze...`);
}

/**
 * Télécharger une facture PDF
 */
function downloadInvoice(id) {
  const facture = allFactures.find(f => f.id === id);
  if (!facture) return;

  if (facture.pdf_url) {
    window.open(facture.pdf_url, '_blank');
  } else {
    alert('PDF für diese Rechnung nicht verfügbar');
  }
}

/**
 * Approuver une facture reçue
 */
async function approveInvoice(id) {
  if (!confirm('Diese Rechnung genehmigen?')) return;

  try {
    const response = await fetch(`/api/factures/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Fehler bei der Genehmigung');

    APP.notify && APP.notify('Rechnung erfolgreich genehmigt', 'success');
    loadRechnungen();
  } catch (error) {
    console.error('Fehler:', error);
    APP.notify && APP.notify('Fehler bei der Genehmigung', 'error');
  }
}

/**
 * Ouvrir le portail client
 */
function openClientPortal(token) {
  const url = `${window.location.origin}/client-portal.html?token=${token}`;
  window.open(url, '_blank');
}

/**
 * Sélectionner une option dans les paramètres
 */
function selectOption(option) {
  // Réinitialiser toutes les options
  document.querySelectorAll('.settings-option').forEach(el => {
    el.classList.remove('active');
  });

  // Activer l'option sélectionnée
  event.currentTarget.classList.add('active');

  // Afficher le formulaire IMAP si nécessaire
  const imapConfig = document.getElementById('imap-config');
  if (option === 'imap-sync') {
    imapConfig.style.display = 'block';
  } else {
    imapConfig.style.display = 'none';
  }
}

/**
 * Gestion des onglets
 */
document.addEventListener('DOMContentLoaded', () => {
  // Gérer les clics sur les onglets
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Mettre à jour les boutons
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Mettre à jour les contenus
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tab}`).classList.add('active');

      currentTab = tab;
    });
  });

  // Charger les factures
  loadRechnungen();
});
