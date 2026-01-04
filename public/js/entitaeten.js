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
 * Édite une entité
 */
async function editEntitaet(id) {
  const entitaet = currentEntitaeten.find(e => e.id === id);
  if (!entitaet) return;

  APP.notify(`Entität ${id} wird bearbeitet...`, 'info');
  // À implémenter
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
