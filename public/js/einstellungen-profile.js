/**
 * einstellungen-profile.js
 *
 * Gestion du profil utilisateur dans la section Einstellungen
 * - Chargement du profil
 * - Modification des données personnelles
 * - Changement de mot de passe
 */

/**
 * Charge le profil de l'utilisateur actuel depuis localStorage
 * et remplit le formulaire de profil
 */
async function loadUserProfile() {
  try {
    const userJson = localStorage.getItem('kontiq_user');
    if (userJson) {
      currentUser = JSON.parse(userJson);

      // Fill profile form
      document.getElementById('profileEmail').value = currentUser.email || '';
      document.getElementById('profileFirstName').value = currentUser.firstName || currentUser.name?.split(' ')[0] || '';
      document.getElementById('profileLastName').value = currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '';
      document.getElementById('profilePhone').value = currentUser.phone || '';
      document.getElementById('profileCompany').value = currentUser.company || '';
      document.getElementById('profileRole').value = currentUser.role || 'Benutzer';
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
}

/**
 * Sauvegarde les modifications du profil utilisateur
 * @param {Event} event - Event du formulaire
 */
async function saveProfile(event) {
  event.preventDefault();

  const firstName = document.getElementById('profileFirstName').value.trim();
  const lastName = document.getElementById('profileLastName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();

  try {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        firstName,
        lastName,
        phone,
        name: `${firstName} ${lastName}`
      })
    });

    if (!response.ok) throw new Error('Failed to update profile');

    // Update localStorage
    currentUser.firstName = firstName;
    currentUser.lastName = lastName;
    currentUser.phone = phone;
    currentUser.name = `${firstName} ${lastName}`;
    localStorage.setItem('kontiq_user', JSON.stringify(currentUser));

    alert('✅ Profil erfolgreich aktualisiert');
  } catch (error) {
    console.error('Profile update error:', error);
    alert('❌ Fehler beim Aktualisieren des Profils');
  }
}

/**
 * Change le mot de passe de l'utilisateur
 * @param {Event} event - Event du formulaire
 */
async function changePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmPassword) {
    alert('❌ Die Passwörter stimmen nicht überein');
    return;
  }

  if (newPassword.length < 8) {
    alert('❌ Das Passwort muss mindestens 8 Zeichen lang sein');
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }

    alert('✅ Passwort erfolgreich geändert');
    document.getElementById('passwordForm').reset();
  } catch (error) {
    console.error('Password change error:', error);
    alert(`❌ ${error.message}`);
  }
}
