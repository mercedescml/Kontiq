/**
 * Sauvegarde un coût depuis le formulaire (create or update)
 */
async function saveKosten(event) {
  event.preventDefault();

  const id = document.getElementById('kostenId')?.value;
  const category = document.getElementById('kostenCategory').value.trim();
  const description = document.getElementById('kostenDescription').value.trim();
  const amount = parseFloat(document.getElementById('kostenAmount').value) || 0;
  const date = document.getElementById('kostenDate').value;

  if (!category || !description || !date) {
    APP.notify('Alle Felder sind erforderlich', 'error');
    return;
  }

  const data = { category, description, amount, date };

  try {
    if (id) {
      // Update existing cost
      await API.kosten.update(id, data);
      APP.notify('Kosten aktualisiert', 'success');
    } else {
      // Create new cost
      await API.kosten.create(data);
      APP.notify('Kosten erstellt', 'success');
    }

    closePlanModal && closePlanModal();
    loadKosten();
  } catch (error) {
    APP.notify('Fehler beim Speichern der Kosten', 'error');
    console.error(error);
  }
}
/**
 * kosten.js - Gestion des Coûts
 * OPTIMISÉ avec cache pour affichage instantané
 */

let currentKosten = [];

/**
 * Charge tous les coûts - avec cache
 */
async function loadKosten() {
  try {
    // Utiliser le cache si disponible pour affichage instantané
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('kosten')) {
      data = DataPreloader.cache.get('kosten');
    } else {
      data = await API.kosten.getAll();
    }
    currentKosten = data.kosten || [];
    displayKosten(currentKosten);
  } catch (error) {
    APP.notify('Fehler beim Laden der Kosten', 'error');
    console.error(error);
  }
}

/**
 * Affiche les coûts
 */
function displayKosten(kosten) {
  const container = document.querySelector('.kosten-list') || 
                   document.querySelector('[data-kosten-container]');
  
  if (!container) return;

  if (kosten.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Kosten gefunden</p>';
    return;
  }

  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr style="border-bottom: 2px solid #E5E7EB;">';
  html += '<th style="text-align: left; padding: 10px;">Kategorie</th>';
  html += '<th style="text-align: left; padding: 10px;">Beschreibung</th>';
  html += '<th style="text-align: left; padding: 10px;">Betrag</th>';
  html += '<th style="text-align: left; padding: 10px;">Datum</th>';
  html += '<th style="text-align: left; padding: 10px;">Aktion</th>';
  html += '</tr></thead><tbody>';

  kosten.forEach(k => {
    html += `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px;">${k.category || '-'}</td>
        <td style="padding: 10px;">${k.description || '-'}</td>
        <td style="padding: 10px;">CHF ${k.amount?.toFixed(2) || '0.00'}</td>
        <td style="padding: 10px;">${k.date || '-'}</td>
        <td style="padding: 10px;">
          <button class="btn btn-secondary" onclick="editKosten('${k.id}')" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">Bearbeiten</button>
          <button class="btn btn-secondary" onclick="deleteKosten('${k.id}')" style="padding: 5px 10px; font-size: 12px; background: #EF4444; color: white;">Löschen</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Edit existing cost - opens modal with data
 */
async function editKosten(id) {
  const kosten = currentKosten.find(k => k.id === id);
  if (!kosten) {
    APP.notify('Kosten nicht gefunden', 'error');
    return;
  }

  // Find or create modal
  let modal = document.getElementById('kostenModal') || document.getElementById('planModal');
  if (!modal) {
    console.warn('Kosten modal not found, creating basic modal');
    modal = createKostenModal();
  }

  // Fill form with kosten data
  const idField = document.getElementById('kostenId');
  const categoryField = document.getElementById('kostenCategory');
  const descriptionField = document.getElementById('kostenDescription');
  const amountField = document.getElementById('kostenAmount');
  const dateField = document.getElementById('kostenDate');

  if (idField) idField.value = kosten.id;
  if (categoryField) categoryField.value = kosten.category || '';
  if (descriptionField) descriptionField.value = kosten.description || '';
  if (amountField) amountField.value = kosten.amount || '';
  if (dateField) dateField.value = kosten.date || '';

  // Update modal title
  const modalTitle = modal.querySelector('.modal-title') || modal.querySelector('h3');
  if (modalTitle) modalTitle.textContent = 'Kosten bearbeiten';

  // Show modal
  modal.style.display = 'flex';
  if (categoryField) categoryField.focus();
}

/**
 * Creates kosten modal if it doesn't exist
 */
function createKostenModal() {
  const modal = document.createElement('div');
  modal.id = 'kostenModal';
  modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 class="modal-title" style="margin: 0 0 20px 0;">Kosten bearbeiten</h3>
      <form onsubmit="saveKosten(event)">
        <input type="hidden" id="kostenId">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Kategorie</label>
          <input type="text" id="kostenCategory" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Beschreibung</label>
          <input type="text" id="kostenDescription" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Betrag</label>
          <input type="number" id="kostenAmount" step="0.01" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Datum</label>
          <input type="date" id="kostenDate" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closePlanModal()" style="padding: 10px 20px; border: 1px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer;">Abbrechen</button>
          <button type="submit" style="padding: 10px 20px; background: #0EB17A; color: white; border: none; border-radius: 8px; cursor: pointer;">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

/**
 * Closes kosten modal
 */
function closePlanModal() {
  const modal = document.getElementById('kostenModal') || document.getElementById('planModal');
  if (modal) modal.style.display = 'none';

  // Reset form
  const form = modal?.querySelector('form');
  if (form) form.reset();

  const idField = document.getElementById('kostenId');
  if (idField) idField.value = '';
}

/**
 * Ajoute un nouveau coût
 */
async function addKosten(data) {
  try {
    const result = await API.kosten.create(data);
    APP.notify('Kosten erstellt', 'success');
    loadKosten();
  } catch (error) {
    APP.notify('Fehler beim Erstellen der Kosten', 'error');
    console.error(error);
  }
}

/**
 * Supprime un coût
 */
async function deleteKosten(id) {
  const confirmed = await APP.confirm('Wollen Sie diese Kosten löschen?');
  if (!confirmed) return;

  try {
    await API.kosten.delete(id);
    APP.notify('Kosten gelöscht', 'success');
    loadKosten();
  } catch (error) {
    APP.notify('Fehler beim Löschen der Kosten', 'error');
    console.error(error);
  }
}

/**
 * Ajoute une catégorie
 */
async function addCategory(categoryName) {
  try {
    await API.categories.add(categoryName);
    APP.notify('Kategorie erstellt', 'success');
  } catch (error) {
    APP.notify('Fehler beim Erstellen der Kategorie', 'error');
    console.error(error);
  }
}

/**
 * Supprime une catégorie
 */
async function deleteCategory(categoryName) {
  const confirmed = await APP.confirm('Wollen Sie diese Kategorie löschen?');
  if (!confirmed) return;

  try {
    await API.categories.delete(categoryName);
    APP.notify('Kategorie gelöscht', 'success');
  } catch (error) {
    APP.notify('Fehler beim Löschen der Kategorie', 'error');
    console.error(error);
  }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Kosten page loaded');
  loadKosten();
});
