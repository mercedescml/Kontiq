/**
 * kpis.js - Gestion des KPIs
 */

let currentKPIs = {};

/**
 * Charge les KPIs
 */
async function loadKPIs() {
  try {
    const data = await API.kpis.getAll();
    currentKPIs = data.kpis || {};
    displayKPIs(currentKPIs);
  } catch (error) {
    APP.notify('Fehler beim Laden der KPIs', 'error');
    console.error(error);
  }
}

/**
 * Affiche les KPIs
 */
function displayKPIs(kpis) {
  const container = document.querySelector('.kpis-grid') || 
                   document.querySelector('[data-kpis-container]');
  
  if (!container) return;

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">';
  
  Object.entries(kpis).forEach(([key, value]) => {
    html += `
      <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-left: 4px solid #10B981;">
        <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${key}</p>
        <h3 style="margin: 0; font-size: 32px; color: #0A2540; font-weight: 700;">${typeof value === 'number' ? value.toFixed(2) : value}</h3>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Actualise les KPIs
 */
async function refreshKPIs() {
  APP.notify('KPIs werden aktualisiert...', 'info');
  await loadKPIs();
  APP.notify('KPIs aktualisiert', 'success');
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('KPIs page loaded');
  loadKPIs();
});
