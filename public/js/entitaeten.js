/**
 * Sauvegarde une entité depuis le formulaire (create or update)
 */
async function saveEntitaet(event) {
  event.preventDefault();

  const id = document.getElementById('entitaetId')?.value;
  const name = document.getElementById('entitaetName').value.trim();
  const type = document.getElementById('entitaetType').value;
  const cheNumber = document.getElementById('entitaetCheNumber').value.trim();
  const foundingDate = document.getElementById('entitaetFoundingDate').value;

  if (!name || !type) {
    APP.notify('Name und Art sind erforderlich', 'error');
    return;
  }

  const data = { name, type, cheNumber, foundingDate };

  try {
    if (id) {
      await API.entitaeten.update(id, data);
      APP.notify('Entität aktualisiert', 'success');
    } else {
      await API.entitaeten.create(data);
      APP.notify('Entität erstellt', 'success');
    }

    closeEntityModal && closeEntityModal();
    loadEntitaeten();
  } catch (error) {
    APP.notify('Fehler beim Speichern der Entität', 'error');
    console.error(error);
  }
}
/**
 * entitaeten.js - Gestion des Entités
 * OPTIMISÉ avec cache pour affichage instantané
 */

let currentEntitaeten = [];

/**
 * Charge les entités - avec cache
 */
async function loadEntitaeten() {
  try {
    // Utiliser le cache si disponible
    let data;
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has('entitaeten')) {
      data = DataPreloader.cache.get('entitaeten');
    } else {
      data = await API.entitaeten.getAll();
    }
    currentEntitaeten = data.entitaeten || [];
    displayEntitaeten(currentEntitaeten);
  } catch (error) {
    APP.notify('Fehler beim Laden der Entitäten', 'error');
    console.error(error);
  }
}

/**
 * Affiche les entités
 */
function displayEntitaeten(entitaeten) {
  const container = document.querySelector('.entitaeten-list') || 
                   document.querySelector('[data-entitaeten-container]');
  
  if (!container) return;

  if (entitaeten.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Entitäten gefunden</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
  
  entitaeten.forEach(e => {
    html += `
      <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 10px 0; color: #0A2540;">${e.name || 'Entität'}</h4>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Art:</strong> ${e.type || '-'}</p>
        <p style="margin: 5px 0; color: #6B7280;"><strong>CHE-Nr:</strong> ${e.cheNumber || '-'}</p>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Gründung:</strong> ${e.foundingDate || '-'}</p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button class="btn btn-secondary" onclick="editEntitaet('${e.id}')" style="flex: 1; padding: 8px; font-size: 12px;">Bearbeiten</button>
          <button class="btn btn-secondary" onclick="deleteEntitaet('${e.id}')" style="flex: 1; padding: 8px; font-size: 12px; background: #EF4444; color: white;">Löschen</button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Ajoute une entité
 */
async function addEntitaet(data) {
  try {
    const result = await API.entitaeten.create(data);
    APP.notify('Entität erstellt', 'success');
    loadEntitaeten();
  } catch (error) {
    APP.notify('Fehler beim Erstellen der Entität', 'error');
    console.error(error);
  }
}

/**
 * Édite une entité - opens modal with data
 */
async function editEntitaet(id) {
  const entitaet = currentEntitaeten.find(e => e.id === id);
  if (!entitaet) {
    APP.notify('Entität nicht gefunden', 'error');
    return;
  }

  let modal = document.getElementById('entityModal');
  if (!modal) {
    modal = createEntityModal();
  }

  const idField = document.getElementById('entitaetId');
  const nameField = document.getElementById('entitaetName');
  const typeField = document.getElementById('entitaetType');
  const cheNumberField = document.getElementById('entitaetCheNumber');
  const foundingDateField = document.getElementById('entitaetFoundingDate');

  if (idField) idField.value = entitaet.id;
  if (nameField) nameField.value = entitaet.name || '';
  if (typeField) typeField.value = entitaet.type || '';
  if (cheNumberField) cheNumberField.value = entitaet.cheNumber || '';
  if (foundingDateField) foundingDateField.value = entitaet.foundingDate || '';

  const modalTitle = modal.querySelector('.modal-title');
  if (modalTitle) modalTitle.textContent = 'Entität bearbeiten';

  modal.style.display = 'flex';
  if (nameField) nameField.focus();
}

function createEntityModal() {
  const modal = document.createElement('div');
  modal.id = 'entityModal';
  modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';

  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 class="modal-title">Entität bearbeiten</h3>
      <form onsubmit="saveEntitaet(event)">
        <input type="hidden" id="entitaetId">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Name</label>
          <input type="text" id="entitaetName" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Art</label>
          <select id="entitaetType" required style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
            <option value="">Bitte wählen</option>
            <option value="GmbH">GmbH</option>
            <option value="AG">AG</option>
            <option value="Einzelunternehmen">Einzelunternehmen</option>
            <option value="Kollektivgesellschaft">Kollektivgesellschaft</option>
            <option value="Kommanditgesellschaft">Kommanditgesellschaft</option>
            <option value="Genossenschaft">Genossenschaft</option>
          </select>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">CHE-Nummer</label>
          <input type="text" id="entitaetCheNumber" placeholder="CHE-123.456.789" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Gründungsdatum</label>
          <input type="date" id="entitaetFoundingDate" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closeEntityModal()" style="padding: 10px 20px; border: 1px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer;">Abbrechen</button>
          <button type="submit" style="padding: 10px 20px; background: #0EB17A; color: white; border: none; border-radius: 8px; cursor: pointer;">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function closeEntityModal() {
  const modal = document.getElementById('entityModal');
  if (modal) modal.style.display = 'none';
  const form = modal?.querySelector('form');
  if (form) form.reset();
  const idField = document.getElementById('entitaetId');
  if (idField) idField.value = '';
}

/**
 * Supprime une entité
 */
async function deleteEntitaet(id) {
  const confirmed = await APP.confirm('Wollen Sie diese Entität löschen?');
  if (!confirmed) return;

  try {
    await API.entitaeten.delete(id);
    APP.notify('Entität gelöscht', 'success');
    loadEntitaeten();
  } catch (error) {
    APP.notify('Fehler beim Löschen der Entität', 'error');
    console.error(error);
  }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Entitäten page loaded');
  loadEntitaeten();
});
