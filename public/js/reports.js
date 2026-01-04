/**
 * reports.js - Gestion des Rapports
 */

let currentReports = [];

/**
 * Génère un rapport
 */
async function generateReport(filters) {
  try {
    APP.notify('Rapport wird generiert...', 'info');
    const result = await API.reports.generate(filters);
    currentReports.push(result);
    APP.notify('Rapport erstellt', 'success');
    displayReports(currentReports);
  } catch (error) {
    APP.notify('Fehler beim Generieren des Berichts', 'error');
    console.error(error);
  }
}

/**
 * Affiche les rapports
 */
function displayReports(reports) {
  const container = document.querySelector('.reports-list') || 
                   document.querySelector('[data-reports-container]');
  
  if (!container) return;

  if (reports.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Keine Berichte gefunden</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
  
  reports.forEach((report, idx) => {
    html += `
      <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 10px 0; color: #0A2540;">${report.name || 'Bericht ' + (idx + 1)}</h4>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Zeitraum:</strong> ${report.startDate} - ${report.endDate}</p>
        <p style="margin: 5px 0; color: #6B7280;"><strong>Erstellt:</strong> ${report.createdAt || '-'}</p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button class="btn btn-secondary" onclick="exportReport('${idx}', 'pdf')" style="flex: 1; padding: 8px; font-size: 12px;">PDF</button>
          <button class="btn btn-secondary" onclick="exportReport('${idx}', 'excel')" style="flex: 1; padding: 8px; font-size: 12px;">Excel</button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Exporte un rapport
 */
async function exportReport(reportIndex, format) {
  try {
    const report = currentReports[reportIndex];
    if (!report) {
      APP.notify('Bericht nicht gefunden', 'error');
      return;
    }

    APP.notify(`${format.toUpperCase()}-Export wird vorbereitet...`, 'info');
    
    if (format === 'pdf') {
      await API.export.toPdf(report);
    } else if (format === 'excel') {
      await API.export.toExcel(report);
    }

    APP.notify(`${format.toUpperCase()} erfolgreich exportiert`, 'success');
  } catch (error) {
    APP.notify('Fehler beim Export', 'error');
    console.error(error);
  }
}

/**
 * Filtre les rapports par période
 */
function filterByPeriod(startDate, endDate) {
  const filtered = currentReports.filter(r => {
    const rStart = new Date(r.startDate);
    const rEnd = new Date(r.endDate);
    return rStart >= new Date(startDate) && rEnd <= new Date(endDate);
  });
  displayReports(filtered);
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Reports page loaded');
  // Charger les rapports existants si nécessaire
});
