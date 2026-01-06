/**
 * Sauvegarde une créance depuis le formulaire
 */
async function saveForderung(event) {
  event.preventDefault();
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
    await addForderung(data);
    APP.notify('Forderung gespeichert', 'success');
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
 * Édite un créance
 */
async function editForderung(id) {
  const forderung = currentForderungen.find(f => f.id === id);
  if (!forderung) return;

  APP.notify(`Forderung ${id} wird bearbeitet...`, 'info');
  // À implémenter
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
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Forderungen page loaded');
  loadForderungen();
});
