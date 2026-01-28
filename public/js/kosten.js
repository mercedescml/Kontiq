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
 * Charge tous les coûts - avec cache (using generic helper)
 */
async function loadKosten() {
  currentKosten = await loadDataWithCache('kosten', displayKosten, 'kosten');
}

/**
 * Affiche les coûts
 */
function displayKosten(kosten) {
  const container = document.querySelector('.kosten-list') ||
                   document.querySelector('[data-kosten-container]');

  if (!container) return;

  if (kosten.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Keine Kosten gefunden</p></div>';
    return;
  }

  let html = '<table class="data-table">';
  html += '<thead><tr>';
  html += '<th>Kategorie</th>';
  html += '<th>Beschreibung</th>';
  html += '<th>Betrag</th>';
  html += '<th>Datum</th>';
  html += '<th>Aktion</th>';
  html += '</tr></thead><tbody>';

  kosten.forEach(k => {
    html += `
      <tr>
        <td>${k.category || '-'}</td>
        <td>${k.description || '-'}</td>
        <td class="amount">CHF ${k.amount?.toFixed(2) || '0.00'}</td>
        <td>${k.date || '-'}</td>
        <td class="actions">
          <button class="btn btn-secondary" onclick="editKosten('${k.id}')">Bearbeiten</button>
          <button class="btn btn-danger" onclick="deleteKosten('${k.id}')">Löschen</button>
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
 * Creates kosten modal if it doesn't exist (using generic helper)
 */
function createKostenModal() {
  return createGenericModal({
    id: 'kostenModal',
    title: 'Kosten bearbeiten',
    idFieldName: 'kostenId',
    maxWidth: '500px',
    singleColumn: true,
    fields: [
      { id: 'kostenCategory', label: 'Kategorie', type: 'text', required: true },
      { id: 'kostenDescription', label: 'Beschreibung', type: 'text', required: true },
      { id: 'kostenAmount', label: 'Betrag', type: 'number', step: '0.01', required: true },
      { id: 'kostenDate', label: 'Datum', type: 'date', required: true }
    ],
    onSubmit: 'saveKosten',
    onClose: 'closePlanModal'
  });
}

/**
 * Closes kosten modal (using generic helper)
 */
function closePlanModal() {
  closeGenericModal('kostenModal', 'kostenId');
  // Also try to close planModal if it exists (for backward compatibility)
  closeGenericModal('planModal', 'kostenId');
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
