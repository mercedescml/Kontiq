/**
 * Sauvegarde un compte bancaire depuis le formulaire (create or update)
 */
async function saveAccount(event) {
  event.preventDefault();
  const id = document.getElementById('accountId')?.value;
  const bank = document.getElementById('accountBank').value.trim();
  const iban = document.getElementById('accountIban').value.trim();
  const balance = parseFloat(document.getElementById('accountBalance').value) || 0;

  if (!bank || !iban) {
    APP.notify('Bank und IBAN sind erforderlich', 'error');
    return;
  }

  const data = { bank, iban, balance };

  try {
    if (id) {
      await API.bankkonten.update(id, data);
      APP.notify('Bankkonto aktualisiert', 'success');
    } else {
      await API.bankkonten.create(data);
      APP.notify('Bankkonto erstellt', 'success');
    }

    closeBankModal();
    loadBankkonten();
  } catch (error) {
    APP.notify('Fehler beim Speichern des Bankkontos', 'error');
    console.error(error);
  }
}
/**
 * bankkonten.js - Gestion des Comptes Bancaires
 * OPTIMISÉ avec cache pour affichage instantané
 */

let currentBankkonten = [];

/**
 * Charge tous les comptes - avec cache
 */
async function loadBankkonten() {
  try {
    // Utiliser le cache si disponible
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('bankkonten')) {
      data = DataPreloader.cache.get('bankkonten');
    } else {
      data = await API.bankkonten.getAll();
    }
    currentBankkonten = data.bankkonten || [];
    displayBankkonten(currentBankkonten);
  } catch (error) {
    APP.notify('Fehler beim Laden der Bankkonten', 'error');
    console.error(error);
  }
}

/**
 * Affiche les comptes bancaires
 */
function displayBankkonten(konten) {
  const container = document.querySelector('.bankkonten-grid') || 
                   document.querySelector('[data-bankkonten-container]');
  
  if (!container) return;

  if (konten.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Bankkonten gefunden</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">';
  
  konten.forEach(k => {
    html += `
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-left: 4px solid #10B981;">
        <h4 style="margin: 0 0 10px 0; color: #0A2540;">${k.name || 'Konto'}</h4>
        <p style="margin: 5px 0; color: #6B7280;"><strong>IBAN:</strong> ${k.iban || '-'}</p>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Bank:</strong> ${k.bank || '-'}</p>
        <p style="margin: 10px 0 15px 0; font-size: 24px; color: #0A2540; font-weight: 700;">
          CHF ${k.balance?.toFixed(2) || '0.00'}
        </p>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="editBankkonto('${k.id}')" style="flex: 1; padding: 8px; font-size: 12px;">Bearbeiten</button>
          <button class="btn btn-secondary" onclick="deleteBankkonto('${k.id}')" style="flex: 1; padding: 8px; font-size: 12px; background: #EF4444; color: white;">Löschen</button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Ajoute un nouveau compte
 */
async function addBankkonto(data) {
  try {
    const result = await API.bankkonten.create(data);
    APP.notify('Bankkonto erstellt', 'success');
    loadBankkonten();
  } catch (error) {
    APP.notify('Fehler beim Erstellen des Bankkontos', 'error');
    console.error(error);
  }
}

/**
 * Edit bankkonto - opens modal with data
 */
async function editBankkonto(id) {
  const konto = currentBankkonten.find(k => k.id === id);
  if (!konto) {
    APP.notify('Bankkonto nicht gefunden', 'error');
    return;
  }

  let modal = document.getElementById('bankModal');
  if (!modal) {
    modal = createBankModal();
  }

  const idField = document.getElementById('accountId');
  const bankField = document.getElementById('accountBank');
  const ibanField = document.getElementById('accountIban');
  const balanceField = document.getElementById('accountBalance');

  if (idField) idField.value = konto.id;
  if (bankField) bankField.value = konto.bank || '';
  if (ibanField) ibanField.value = konto.iban || '';
  if (balanceField) balanceField.value = konto.balance || 0;

  const modalTitle = modal.querySelector('.modal-title') || modal.querySelector('h3');
  if (modalTitle) modalTitle.textContent = 'Bankkonto bearbeiten';

  modal.style.display = 'flex';
  if (bankField) bankField.focus();
}

function createBankModal() {
  const modal = document.createElement('div');
  modal.id = 'bankModal';
  modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 class="modal-title">Bankkonto bearbeiten</h3>
      <form onsubmit="saveAccount(event)">
        <input type="hidden" id="accountId">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Bank</label>
          <input type="text" id="accountBank" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">IBAN</label>
          <input type="text" id="accountIban" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Saldo</label>
          <input type="number" id="accountBalance" step="0.01" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closeBankModal()" style="padding: 10px 20px; border: 1px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer;">Abbrechen</button>
          <button type="submit" style="padding: 10px 20px; background: #0EB17A; color: white; border: none; border-radius: 8px; cursor: pointer;">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function closeBankModal() {
  const modal = document.getElementById('bankModal');
  if (modal) modal.style.display = 'none';
  const form = modal?.querySelector('form');
  if (form) form.reset();
  const idField = document.getElementById('accountId');
  if (idField) idField.value = '';
}

/**
 * Supprime un compte
 */
async function deleteBankkonto(id) {
  const confirmed = await APP.confirm('Wollen Sie dieses Bankkonto löschen?');
  if (!confirmed) return;

  try {
    await API.bankkonten.delete(id);
    APP.notify('Bankkonto gelöscht', 'success');
    loadBankkonten();
  } catch (error) {
    APP.notify('Fehler beim Löschen des Bankkontos', 'error');
    console.error(error);
  }
}

/**
 * Synchronise avec l'API bancaire
 */
async function syncBankAccounts() {
  try {
    APP.notify('Bankkonten werden synchronisiert...', 'info');
    // À implémenter: sync avec API bancaire
    await loadBankkonten();
    APP.notify('Synchronisation abgeschlossen', 'success');
  } catch (error) {
    APP.notify('Fehler bei der Synchronisation', 'error');
    console.error(error);
  }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bankkonten page loaded');
  loadBankkonten();
});
