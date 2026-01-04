/**
 * einstellungen.js - Gestion des Paramètres
 */

let currentSettings = {};

/**
 * Charge les paramètres
 */
async function loadSettings() {
  try {
    const data = await API.einstellungen.get();
    currentSettings = data.settings || {};
    displaySettings(currentSettings);
  } catch (error) {
    APP.notify('Fehler beim Laden der Einstellungen', 'error');
    console.error(error);
  }
}

/**
 * Affiche les paramètres
 */
function displaySettings(settings) {
  const container = document.querySelector('.settings-form') || 
                   document.querySelector('[data-settings-container]');
  
  if (!container) return;

  let html = '<form id="settingsForm" style="max-width: 600px;">';
  
  html += `
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">Unternehmensname:</label>
      <input type="text" value="${settings.companyName || ''}" id="companyName" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px;">
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">E-Mail:</label>
      <input type="email" value="${settings.email || ''}" id="email" disabled style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px; background: #F9FAFB; cursor: not-allowed;">
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">Neues Passwort:</label>
      <input type="password" placeholder="Lassen Sie leer, wenn Sie nicht ändern möchten" id="newPassword" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px;">
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">Passwort bestätigen:</label>
      <input type="password" placeholder="Passwort bestätigen" id="confirmPassword" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px;">
    </div>

    <div style="margin-bottom: 20px;">
      <label style="display: flex; align-items: center;">
        <input type="checkbox" id="notificationsEnabled" ${settings.notificationsEnabled ? 'checked' : ''} style="margin-right: 10px;">
        <span>Benachrichtigungen aktivieren</span>
      </label>
    </div>

    <div style="display: flex; gap: 10px;">
      <button type="button" class="btn btn-primary" onclick="saveSettings()" style="flex: 1;">Speichern</button>
      <button type="button" class="btn btn-secondary" onclick="resetPassword()" style="flex: 1;">Passwort zurücksetzen</button>
    </div>
  </form>
  `;

  container.innerHTML = html;
}

/**
 * Sauvegarde les paramètres
 */
async function saveSettings() {
  const settings = {
    companyName: document.getElementById('companyName')?.value,
    notificationsEnabled: document.getElementById('notificationsEnabled')?.checked,
    email: currentSettings.email
  };

  const newPassword = document.getElementById('newPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (newPassword && newPassword !== confirmPassword) {
    APP.notify('Les mots de passe ne correspondent pas', 'error');
    return;
  }

  if (newPassword) {
    settings.password = newPassword;
  }

  try {
    await API.einstellungen.update(settings);
    APP.notify('Einstellungen gespeichert', 'success');
    currentSettings = settings;
  } catch (error) {
    APP.notify('Fehler beim Speichern der Einstellungen', 'error');
    console.error(error);
  }
}

/**
 * Réinitialise le mot de passe
 */
async function resetPassword() {
  const confirmed = await APP.confirm('Ein Passwort-Rücksetzungslink wird an Ihre E-Mail gesendet.');
  if (!confirmed) return;

  try {
    APP.notify('Passwort-Rücksetzungslink wird gesendet...', 'info');
    // À implémenter: envoyer email de réinitialisation
    setTimeout(() => {
      APP.notify('Überprüfen Sie Ihre E-Mails', 'success');
    }, 1000);
  } catch (error) {
    APP.notify('Fehler beim Zurücksetzen des Passworts', 'error');
    console.error(error);
  }
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Einstellungen page loaded');
  loadSettings();

  // Afficher l'alerte si l'onboarding n'est pas terminé
  const alertEl = document.getElementById('onboarding-alert');
  const completed = localStorage.getItem('kontiq_onboarding_complete');
  const progress = localStorage.getItem('kontiq_onboarding_progress');
  if (alertEl && !completed && progress) {
    alertEl.style.display = 'flex';
  }
});
