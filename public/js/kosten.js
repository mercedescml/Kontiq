/**
 * Sauvegarde un coût depuis le formulaire
 */
async function saveKosten(event) {
  event.preventDefault();
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
    await addKosten(data);
    APP.notify('Kosten gespeichert', 'success');
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
          <button class="btn btn-secondary" onclick="deleteKosten('${k.id}')" style="padding: 5px 10px; font-size: 12px; background: #EF4444; color: white;">Löschen</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
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
