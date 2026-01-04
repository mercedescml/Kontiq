/**
 * abonnement.js - Gestion de l'Abonnement
 */

let currentAbonnement = {};

/**
 * Charge le statut d'abonnement
 */
async function loadAbonnement() {
  try {
    const data = await API.abonnement.getStatus();
    currentAbonnement = data.abonnement || {};
    displayAbonnement(currentAbonnement);
  } catch (error) {
    APP.notify('Fehler beim Laden des Abonnements', 'error');
    console.error(error);
  }
}

/**
 * Affiche les informations d'abonnement
 */
function displayAbonnement(abonnement) {
  const container = document.querySelector('.abonnement-info') || 
                   document.querySelector('[data-abonnement-container]');
  
  if (!container) return;

  const statusColor = {
    'active': '#10B981',
    'paused': '#F59E0B',
    'cancelled': '#EF4444'
  }[abonnement.status] || '#6B7280';

  let html = `
    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="margin: 0 0 20px 0; color: #0A2540;">Abonnement</h2>
      
      <div style="margin-bottom: 20px;">
        <p style="color: #6B7280; margin: 0 0 5px 0;">Status:</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${statusColor};">${abonnement.status || 'Unbekannt'}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="color: #6B7280; margin: 0 0 5px 0;">Plan:</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0A2540;">${abonnement.plan || '-'}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="color: #6B7280; margin: 0 0 5px 0;">Preis:</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0A2540;">CHF ${abonnement.price?.toFixed(2) || '0.00'} / Monat</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="color: #6B7280; margin: 0 0 5px 0;">Nächste Abrechnung:</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0A2540;">${abonnement.nextBillingDate || '-'}</p>
      </div>

      <div style="background: #F9FAFB; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #0A2540;">Tarife</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px 0; font-weight: 600;">Starter</td>
            <td style="padding: 8px 0;">CHF 49/Mo</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px 0; font-weight: 600;">Professional</td>
            <td style="padding: 8px 0;">CHF 99/Mo</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Enterprise</td>
            <td style="padding: 8px 0;">Auf Anfrage</td>
          </tr>
        </table>
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-primary" onclick="upgradePlan()" style="flex: 1;">Plan upgraden</button>
        <button class="btn btn-secondary" onclick="pauseAbonnement()" style="flex: 1;">Pausieren</button>
        <button class="btn btn-secondary" onclick="cancelAbonnement()" style="flex: 1; background: #EF4444; color: white;">Kündigen</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Upgrade le plan
 */
async function upgradePlan() {
  APP.notify('Plan-Upgrade wird vorbereitet...', 'info');
  // À implémenter: ouvrir modal de sélection de plan
}

/**
 * Met en pause l'abonnement
 */
async function pauseAbonnement() {
  const confirmed = await APP.confirm('Wollen Sie Ihr Abonnement pausieren?');
  if (!confirmed) return;

  try {
    await API.abonnement.update({ status: 'paused' });
    APP.notify('Abonnement pausiert', 'success');
    loadAbonnement();
  } catch (error) {
    APP.notify('Fehler beim Pausieren des Abonnements', 'error');
    console.error(error);
  }
}

/**
 * Annule l'abonnement
 */
async function cancelAbonnement() {
  const confirmed = await APP.confirm('Wollen Sie Ihr Abonnement kündigen? Dies kann nicht rückgängig gemacht werden.');
  if (!confirmed) return;

  try {
    await API.abonnement.update({ status: 'cancelled' });
    APP.notify('Abonnement gekündigt', 'success');
    loadAbonnement();
  } catch (error) {
    APP.notify('Fehler beim Kündigen des Abonnements', 'error');
    console.error(error);
  }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Abonnement page loaded');
  loadAbonnement();
});
