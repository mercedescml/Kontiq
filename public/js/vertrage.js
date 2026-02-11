/**
 * Verträge (Contracts) Management
 * FIXED: This file was missing, causing contracts page to be non-functional
 */

let currentContracts = [];

/**
 * Load contracts from API
 */
async function loadContracts() {
  try {
    // Use cache if available
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('contracts')) {
      data = DataPreloader.cache.get('contracts');
    } else {
      data = await API.contracts.getAll();
    }

    currentContracts = data.contracts || [];
    displayContracts(currentContracts);
  } catch (error) {
    console.error('Error loading contracts:', error);
    if (typeof APP !== 'undefined' && APP.notify) {
      APP.notify('Fehler beim Laden der Verträge', 'error');
    }
  }
}

/**
 * Display contracts in grid
 */
function displayContracts(contracts) {
  const container = document.querySelector('[data-contracts-container]') ||
                   document.querySelector('.contracts-list') ||
                   document.querySelector('#contractsContainer');

  if (!container) {
    console.warn('Contracts container not found');
    return;
  }

  if (contracts.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 64px 32px; background: #F9FAFB; border-radius: 12px; border: 2px dashed #E5E7EB;">
        <svg style="width: 64px; height: 64px; margin: 0 auto 24px; stroke: #9CA3AF; fill: none; stroke-width: 1.5;" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 style="font-size: 20px; font-weight: 700; color: #0A2540; margin: 0 0 8px 0;">Keine Verträge vorhanden</h3>
        <p style="font-size: 14px; color: #6B7280; margin: 0;">Erstellen Sie Ihren ersten Vertrag, um zu beginnen</p>
      </div>
    `;
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px;">';

  contracts.forEach(contract => {
    const statusColors = {
      'active': 'background: #D1FAE5; color: #065F46;',
      'pending': 'background: #FEF3C7; color: #92400E;',
      'expired': 'background: #FEE2E2; color: #991B1B;',
      'cancelled': 'background: #E5E7EB; color: #1F2937;'
    };

    const statusStyle = statusColors[contract.status] || statusColors['pending'];

    html += `
      <div class="contract-card" style="background: white; padding: 24px; border-radius: 12px; border: 2px solid #E5E7EB; transition: all 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0A2540;">${escapeHtml(contract.name)}</h3>
            <span style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; ${statusStyle}">
              ${getStatusLabel(contract.status)}
            </span>
          </div>
        </div>

        <div style="margin: 16px 0;">
          <div style="margin-bottom: 10px;">
            <span style="font-size: 12px; color: #6B7280; text-transform: uppercase; font-weight: 600;">Partner</span>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #0A2540; font-weight: 500;">${escapeHtml(contract.partner || '-')}</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
            <div>
              <span style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Start</span>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #0A2540;">${formatDate(contract.startDate)}</p>
            </div>
            <div>
              <span style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Ende</span>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #0A2540;">${formatDate(contract.endDate)}</p>
            </div>
          </div>

          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
            <span style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Betrag</span>
            <p style="margin: 4px 0 0 0; font-size: 20px; color: #0A2540; font-weight: 700; font-family: 'Roboto Mono', monospace;">
              ${formatCurrency(contract.amount)}
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <button onclick="editContract('${contract.id}')" style="flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1.5px solid #E5E7EB; background: white; color: #0A2540;">
            Bearbeiten
          </button>
          <button onclick="deleteContract('${contract.id}')" style="flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1.5px solid #FEE2E2; background: white; color: #DC2626;">
            Löschen
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Open modal to add new contract
 */
function addContract() {
  const modal = document.getElementById('contractModal');
  if (!modal) {
    console.error('Contract modal not found');
    return;
  }

  // Reset form
  const form = document.getElementById('contractForm');
  if (form) form.reset();

  const idField = document.getElementById('contractId');
  if (idField) idField.value = '';

  const title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Neuer Vertrag erstellen';

  // Show modal
  modal.style.display = 'flex';

  // Focus first input
  const firstInput = document.getElementById('contractName');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

/**
 * Edit existing contract
 */
function editContract(id) {
  const contract = currentContracts.find(c => c.id === id);
  if (!contract) {
    console.error('Contract not found:', id);
    return;
  }

  const modal = document.getElementById('contractModal');
  if (!modal) {
    console.error('Contract modal not found');
    return;
  }

  // Fill form with contract data
  const fields = {
    'contractId': contract.id,
    'contractName': contract.name,
    'contractPartner': contract.partner,
    'contractStartDate': contract.startDate,
    'contractEndDate': contract.endDate,
    'contractAmount': contract.amount,
    'contractStatus': contract.status
  };

  Object.keys(fields).forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.value = fields[fieldId] || '';
  });

  const title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Vertrag bearbeiten';

  // Show modal
  modal.style.display = 'flex';
}

/**
 * Save contract (create or update)
 */
async function saveContract(event) {
  if (event) event.preventDefault();

  const id = document.getElementById('contractId')?.value;
  const name = document.getElementById('contractName')?.value;
  const partner = document.getElementById('contractPartner')?.value;
  const startDate = document.getElementById('contractStartDate')?.value;
  const endDate = document.getElementById('contractEndDate')?.value;
  const amount = document.getElementById('contractAmount')?.value;
  const status = document.getElementById('contractStatus')?.value || 'active';

  // Validation
  if (!name || !partner || !startDate || !endDate || !amount) {
    if (typeof APP !== 'undefined' && APP.notify) {
      APP.notify('Bitte füllen Sie alle Pflichtfelder aus', 'error');
    } else {
      alert('Bitte füllen Sie alle Pflichtfelder aus');
    }
    return;
  }

  const data = {
    name,
    partner,
    startDate,
    endDate,
    amount: parseFloat(amount),
    status
  };

  try {
    if (id) {
      // Update existing
      await API.contracts.update(id, data);
      if (typeof APP !== 'undefined' && APP.notify) {
        APP.notify('Vertrag aktualisiert', 'success');
      }
    } else {
      // Create new
      await API.contracts.create(data);
      if (typeof APP !== 'undefined' && APP.notify) {
        APP.notify('Vertrag erstellt', 'success');
      }
    }

    closeContractModal();
    await loadContracts();
  } catch (error) {
    console.error('Error saving contract:', error);
    if (typeof APP !== 'undefined' && APP.notify) {
      APP.notify('Fehler beim Speichern', 'error');
    } else {
      alert('Fehler beim Speichern des Vertrags');
    }
  }
}

/**
 * Delete contract
 */
async function deleteContract(id) {
  const confirmed = confirm('Möchten Sie diesen Vertrag wirklich löschen?');
  if (!confirmed) return;

  try {
    await API.contracts.delete(id);
    if (typeof APP !== 'undefined' && APP.notify) {
      APP.notify('Vertrag gelöscht', 'success');
    }
    await loadContracts();
  } catch (error) {
    console.error('Error deleting contract:', error);
    if (typeof APP !== 'undefined' && APP.notify) {
      APP.notify('Fehler beim Löschen', 'error');
    } else {
      alert('Fehler beim Löschen des Vertrags');
    }
  }
}

/**
 * Close contract modal
 */
function closeContractModal() {
  const modal = document.getElementById('contractModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Utility: Format currency
 */
function formatCurrency(value) {
  if (!value && value !== 0) return '€0';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Utility: Format date
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Utility: Get status label in German
 */
function getStatusLabel(status) {
  const labels = {
    'active': 'Aktiv',
    'pending': 'Ausstehend',
    'expired': 'Abgelaufen',
    'cancelled': 'Gekündigt'
  };
  return labels[status] || status;
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize when page loads
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Contracts (Verträge) page loaded');
  loadContracts();

  // Setup modal close on overlay click
  const modal = document.getElementById('contractModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeContractModal();
      }
    });
  }

  // Setup form submission
  const form = document.getElementById('contractForm');
  if (form) {
    form.addEventListener('submit', saveContract);
  }
});
