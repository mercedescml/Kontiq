/**
 * liquiditat.js - Gestion de la page Liquidité
 */

// États pour les modales
let creditSimulatorOpen = false;

/**
 * Ouvre la modal du simulateur crédit vs skonto
 */
async function openCreditSimulator() {
  creditSimulatorOpen = true;
  
  const modal = document.getElementById('creditSimulatorModal');
  if (modal) {
    modal.style.display = 'block';
  } else {
    // Créer la modal si elle n'existe pas
    const newModal = document.createElement('div');
    newModal.id = 'creditSimulatorModal';
    newModal.className = 'modal';
    newModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Kredit vs Skonto Simulator</h2>
          <button onclick="closeCreditSimulator()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 15px;">
            <label>Kreditbetrag (CHF):</label>
            <input type="number" id="creditAmount" placeholder="0.00" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #E5E7EB; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Zinssatz (%):</label>
            <input type="number" id="creditRate" placeholder="5" step="0.1" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #E5E7EB; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Laufzeit (Tage):</label>
            <input type="number" id="creditTerm" placeholder="30" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #E5E7EB; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label>Skontosatz (%):</label>
            <input type="number" id="discountRate" placeholder="2" step="0.1" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #E5E7EB; border-radius: 4px;">
          </div>
          <button onclick="calculateCreditSimulation()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Berechnen</button>
          <div id="simulationResult" style="margin-top: 20px; padding: 15px; background: #F9FAFB; border-radius: 6px; display: none;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(newModal);
  }
}

/**
 * Ferme la modal du simulateur
 */
function closeCreditSimulator() {
  creditSimulatorOpen = false;
  const modal = document.getElementById('creditSimulatorModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Calcule la simulation
 */
async function calculateCreditSimulation() {
  const amount = parseFloat(document.getElementById('creditAmount').value);
  const rate = parseFloat(document.getElementById('creditRate').value);
  const term = parseInt(document.getElementById('creditTerm').value);
  const discountRate = parseFloat(document.getElementById('discountRate').value);

  if (!amount || !rate || !term) {
    APP.notify('Bitte alle Felder ausfüllen', 'error');
    return;
  }

  try {
    // Calcul du coût du crédit
    const creditCost = (amount * rate * term) / (100 * 365);
    const discountAmount = (amount * discountRate) / 100;
    
    const result = {
      creditCost,
      discountAmount,
      recommendation: creditCost < discountAmount ? 'Kredit nehmen' : 'Skonto nutzen'
    };

    // Afficher le résultat
    const resultDiv = document.getElementById('simulationResult');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <h4 style="margin-top: 0; color: #0A2540;">Ergebnis:</h4>
      <p><strong>Kreditkosten:</strong> CHF ${creditCost.toFixed(2)}</p>
      <p><strong>Skontobetrag:</strong> CHF ${discountAmount.toFixed(2)}</p>
      <p style="padding: 10px; background: white; border-left: 4px solid #10B981; margin-top: 15px;">
        <strong>Empfehlung:</strong> ${result.recommendation}
      </p>
    `;
  } catch (error) {
    APP.notify('Fehler bei der Berechnung', 'error');
    console.error(error);
  }
}

/**
 * Exporte les données en PDF
 */
async function exportPDF() {
  try {
    APP.notify('PDF wird vorbereitet...', 'info');
    // Appel API à implémenter
    const result = await API.export.toPdf({});
    APP.notify('PDF erfolgreich erstellt', 'success');
    // Télécharger le fichier
    console.log('PDF export result:', result);
  } catch (error) {
    APP.notify('Fehler beim PDF-Export', 'error');
    console.error(error);
  }
}

/**
 * Prépare un virement
 */
async function prepareTransfer() {
  APP.notify('Überweisung wird vorbereitet...', 'info');
  // À implémenter: ouvrir une modal de préparation de virement
  setTimeout(() => {
    APP.notify('Überweisung bereit zum Senden', 'success');
  }, 1000);
}

/**
 * Crée une facture
 */
async function createInvoice() {
  APP.notify('Rechnung wird erstellt...', 'info');
  // À implémenter: ouvrir une modal de création de facture
  setTimeout(() => {
    APP.notify('Rechnung erstellt', 'success');
  }, 1000);
}

/**
 * Ouvre l'aperçu des comptes bancaires
 */
function openAccountOverview() {
  APP.notify('Kontoübersicht wird geöffnet...', 'info');
  // Rediriger vers la page bankkonten
  APP.navigateTo('bankkonten');
}

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Liquiditat page loaded');
  
  // Attacher les fonctions aux boutons
  const creditBtn = document.querySelector('[onclick="openCreditSimulator()"]');
  if (creditBtn) creditBtn.onclick = openCreditSimulator;

  const exportBtn = document.querySelector('button.btn-primary');
  if (exportBtn && exportBtn.textContent.includes('Export')) {
    exportBtn.onclick = exportPDF;
  }

  // Attacher aux action cards
  const actionCards = document.querySelectorAll('.action-card');
  if (actionCards.length >= 4) {
    actionCards[0].onclick = prepareTransfer;
    actionCards[1].onclick = createInvoice;
    actionCards[2].onclick = exportPDF;
    actionCards[3].onclick = openAccountOverview;
  }
});
