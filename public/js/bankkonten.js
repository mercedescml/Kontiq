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
 * Édite un compte
 */
async function editBankkonto(id) {
  const konto = currentBankkonten.find(k => k.id === id);
  if (!konto) return;

  APP.notify(`Bankkonto ${id} wird bearbeitet...`, 'info');
  // À implémenter: ouvrir modal d'édition
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
