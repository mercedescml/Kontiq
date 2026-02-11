/**
 * einstellungen-entities.js
 *
 * Gestion des entités et permissions par entité dans la section Einstellungen
 * - Affichage de la liste des entités
 * - Gestion des utilisateurs ayant accès à chaque entité
 * - Ajout/suppression de permissions par entité
 */

function populateEntitiesList() {
  const container = document.getElementById('entities-access-container');
  if (!container) return;
  
  // If no entities exist, show message to create one first
  if (!allEntities || allEntities.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 40px;background:#F9FAFB;border-radius:12px;border:2px dashed #E5E7EB">
        <div style="font-size:48px;margin-bottom:16px">🏢</div>
        <h3 style="margin:0 0 8px 0;color:#0A2540">Keine Entitäten vorhanden</h3>
        <p style="color:#6B7280;margin:0 0 20px 0">Erstellen Sie zuerst eine Entität im Menü "Entitäten", um Zugriffsrechte vergeben zu können.</p>
        <button class="btn btn-primary" onclick="window.location.hash='entitaeten'">
          Zur Entitäten-Verwaltung
        </button>
      </div>
    `;
    return;
  }
  
  // Show entity access management with dropdown
  let html = `
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin-bottom:24px">
      <div style="font-weight:600;color:#059669;margin-bottom:4px">💡 Zugriff verwalten</div>
      <div style="color:#065F46;font-size:14px">Wählen Sie eine Entität aus und bestimmen Sie, welche Benutzer darauf zugreifen dürfen.</div>
    </div>
    
    <div style="margin-bottom:24px">
      <label style="font-weight:600;font-size:14px;color:#0A2540;display:block;margin-bottom:8px">Entität auswählen</label>
      <select id="entity-selector" class="select" onchange="loadEntityUsers()" style="width:100%;max-width:400px">
        <option value="">-- Entität wählen --</option>
        ${allEntities.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
      </select>
    </div>
    
    <div id="entity-users-section" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:16px;color:#0A2540" id="entity-users-title">Benutzer mit Zugriff</h3>
        <button class="btn btn-success btn-sm" onclick="openAddEntityUserModal()">+ Benutzer hinzufügen</button>
      </div>
      <div id="entity-users-list"></div>
    </div>
  `;
  
  container.innerHTML = html;
}

// Load users for selected entity

function loadEntityUsers() {
  const selector = document.getElementById('entity-selector');
  const section = document.getElementById('entity-users-section');
  const list = document.getElementById('entity-users-list');
  const title = document.getElementById('entity-users-title');
  
  const entityId = selector.value;
  if (!entityId) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  const entity = allEntities.find(e => e.id === entityId);
  title.textContent = `Benutzer mit Zugriff auf "${entity?.name || 'Entität'}"`;
  
  // Build user list
  let usersHtml = '';
  
  // First: Show all managers/Geschäftsführer of this entity
  const entityManagers = getEntityManagers(entity);
  if (entityManagers.length > 0) {
    usersHtml += `<div style="font-weight:600;font-size:14px;color:#374151;margin-bottom:8px">👑 Geschäftsführer / Manager (${entityManagers.length})</div>`;
    entityManagers.forEach((managerEmail, idx) => {
      const managerUser = allUsers.find(u => u.email === managerEmail);
      usersHtml += `
        <div style="padding:12px;border:2px solid #0EB17A;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;background:#F0FDF4">
          <div>
            <div style="font-weight:600">${managerUser?.name || managerEmail}</div>
            <div style="font-size:12px;color:#059669">👑 Geschäftsführer - Vollzugriff</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="background:#059669;color:white;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:600">Manager ${idx + 1}</span>
            ${entityManagers.length > 1 && isGeschaeftsfuehrer ? `<button class="btn btn-sm" style="background:#FEE2E2;color:#DC2626" onclick="removeManager('${entityId}', '${managerEmail}')">Entfernen</button>` : ''}
          </div>
        </div>
      `;
    });
    
    // Button to add another manager
    if (isGeschaeftsfuehrer) {
      usersHtml += `
        <button class="btn btn-sm btn-secondary" onclick="openAddManagerModal('${entityId}')" style="margin-bottom:16px">
          + Weiteren Geschäftsführer hinzufügen
        </button>
      `;
    }
  }
  
  // Divider
  usersHtml += `<div style="border-top:1px solid #E5E7EB;margin:16px 0;padding-top:16px"><div style="font-weight:600;font-size:14px;color:#374151;margin-bottom:8px">👥 Weitere Benutzer mit Zugriff</div></div>`;
  
  // Then: Other users with access (not managers)
  const entityPerms = allPermissions[entityId] || {};
  const otherUsers = Object.keys(entityPerms).filter(email => !entityManagers.includes(email));
  
  if (otherUsers.length === 0) {
    usersHtml += `<div style="text-align:center;padding:24px;color:#6B7280;border:1px dashed #E5E7EB;border-radius:8px">
      Noch keine weiteren Benutzer hinzugefügt
    </div>`;
  } else {
    otherUsers.forEach(email => {
      const user = allUsers.find(u => u.email === email);
      const perms = entityPerms[email]?.permissions || {};
      const moduleIcons = Object.keys(perms).map(m => MODULES[m]?.icon || '').join(' ');
      
      usersHtml += `
        <div style="padding:12px;border:1px solid #E5E7EB;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <div style="font-weight:600">${user?.name || email}</div>
            <div style="font-size:12px;color:#6B7280">${moduleIcons || 'Zugriff konfiguriert'}</div>
          </div>
          <button class="btn btn-sm" style="background:#FEE2E2;color:#DC2626" onclick="removeEntityUser('${entityId}', '${email}')">Entfernen</button>
        </div>
      `;
    });
  }
  
  list.innerHTML = usersHtml;
}

// Open modal to add user to entity

function openEntityPermissions(entityId) {
  currentEntityId = entityId;
  const entity = allEntities.find(e => e.id === entityId);
  if (!entity) return;
  
  const entityManagers = getEntityManagers(entity);
  const isManager = isManagerOf(entity, currentUser.email);
  if (!isGeschaeftsfuehrer && !isManager) {
    alert('Sie haben keine Berechtigung, diese Entität zu verwalten.');
    return;
  }
  
  const entityPerms = allPermissions[entityId] || {};
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'entity-perms-modal';
  
  // Build users list - All managers first, then other users
  let usersHtml = '';
  
  // First: Show all entity managers/Geschäftsführer
  if (entityManagers.length > 0) {
    usersHtml += `<div style="font-weight:600;font-size:14px;color:#374151;margin-bottom:8px">👑 Geschäftsführer (${entityManagers.length})</div>`;
    entityManagers.forEach((managerEmail, idx) => {
      const managerUser = allUsers.find(u => u.email === managerEmail);
      usersHtml += `
        <div style="padding:12px;border:2px solid #0EB17A;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;background:#F0FDF4">
          <div>
            <div style="font-weight:600">${managerUser?.name || managerEmail}</div>
            <div style="font-size:12px;color:#059669">👑 Geschäftsführer - Vollzugriff</div>
          </div>
          <span class="badge badge-admin" style="background:#059669;color:white">Manager ${idx + 1}</span>
        </div>
      `;
    });
  }
  
  // Then: Other users with access (not managers)
  Object.keys(entityPerms).forEach(userEmail => {
    // Skip if this is one of the managers (already shown above)
    if (entityManagers.includes(userEmail)) return;
    
    const user = allUsers.find(u => u.email === userEmail);
    const perms = entityPerms[userEmail].permissions || {};
    const permIcons = Object.keys(perms).map(m => MODULES[m]?.icon || m).join(' ');
    
    usersHtml += `
      <div style="padding:12px;border:1px solid #E5E7EB;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <div style="font-weight:600">${user?.name || userEmail}</div>
          <div style="font-size:12px;color:#6B7280">${permIcons || 'Keine Module'}</div>
        </div>
        <button class="btn btn-sm" style="background:#FEE2E2;color:#DC2626" onclick="removeEntityUser('${entityId}', '${userEmail}')">Entfernen</button>
      </div>
    `;
  });
  
  // Count non-manager users
  const otherUsersCount = Object.keys(entityPerms).filter(e => !entityManagers.includes(e)).length;
  if (otherUsersCount === 0 && entityManagers.length > 0) {
    usersHtml += '<div style="color:#6B7280;text-align:center;padding:20px;border:1px dashed #E5E7EB;border-radius:8px;margin-top:8px">Noch keine weiteren Benutzer hinzugefügt</div>';
  } else if (entityManagers.length === 0 && Object.keys(entityPerms).length === 0) {
    usersHtml = '<div style="color:#6B7280;text-align:center;padding:20px">Keine Benutzer haben Zugriff auf diese Entität</div>';
  }
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width:700px">
      <div class="modal-header">
        <div>
          <h3>👥 ${entity.name}</h3>
          <p>${isManager ? 'Sie sind Manager dieser Entität' : 'Geschäftsführer-Zugriff'}</p>
        </div>
        <button class="close-modal" onclick="closeEntityPermsModal()">×</button>
      </div>
      
      <div class="alert alert-info" style="margin-bottom:20px">
        <div>
          <div class="alert-title">Entitäts-Berechtigungen</div>
          <div class="alert-message">${isManager ? 'Als Manager können Sie festlegen, wer Zugriff auf diese Entität hat und was sie sehen/bearbeiten dürfen.' : 'Sie können festlegen, wer Zugriff auf diese Entität hat.'}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Benutzer mit Zugriff</div>
        <div id="entity-users-list">${usersHtml}</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="section">
        <div class="section-title">Benutzer hinzufügen</div>
        <div class="form-group">
          <label class="label">Benutzer wählen</label>
          <select class="select" id="entity-add-user">
            <option value="">Benutzer auswählen...</option>
            ${allUsers.filter(u => !entityPerms[u.email] && !entityManagers.includes(u.email) && u.globalPermissions?.role !== 'geschaeftsfuehrer').map(u => `
              <option value="${u.email}">${u.name || u.email}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group" id="entity-user-perms" style="display:none">
          <label class="label">Module-Berechtigungen für diese Entität</label>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px">
            ${Object.keys(MODULES).map(moduleKey => {
              const module = MODULES[moduleKey];
              return `
                <div style="border:1px solid #E5E7EB;border-radius:8px;padding:12px">
                  <div style="font-weight:600;font-size:14px;margin-bottom:8px">${module.icon} ${module.label}</div>
                  <div style="display:flex;gap:12px">
                    <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer">
                      <input type="checkbox" id="entity-${moduleKey}-view" style="accent-color:#0EB17A">
                      👁️ Ansehen
                    </label>
                    <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer">
                      <input type="checkbox" id="entity-${moduleKey}-edit" style="accent-color:#0EB17A">
                      ✏️ Bearbeiten
                    </label>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button class="btn btn-success" style="margin-top:16px;width:100%" onclick="addUserToEntity()">Benutzer hinzufügen</button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeEntityPermsModal()">Schließen</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Show permissions when user is selected
  document.getElementById('entity-add-user').addEventListener('change', function() {
    document.getElementById('entity-user-perms').style.display = this.value ? 'block' : 'none';
  });
}


function closeEntityPermsModal() {
  const modal = document.getElementById('entity-perms-modal');
  if (modal) modal.remove();
  currentEntityId = null;
}

// Create entity modal

async function addUserToEntity() {
  const userEmail = document.getElementById('entity-add-user').value;
  if (!userEmail) {
    alert('Bitte wählen Sie einen Benutzer aus');
    return;
  }
  
  const permissions = { permissions: {} };
  
  Object.keys(MODULES).forEach(moduleKey => {
    const view = document.getElementById(`entity-${moduleKey}-view`)?.checked || false;
    const edit = document.getElementById(`entity-${moduleKey}-edit`)?.checked || false;
    
    if (view || edit) {
      permissions.permissions[moduleKey] = { view, edit };
    }
  });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/permissions/entity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminEmail: currentUser.email,
        entityId: currentEntityId,
        targetEmail: userEmail,
        permissions
      })
    });
    
    if (res.ok) {
      alert('Benutzer erfolgreich hinzugefügt');
      closeEntityPermsModal();
      loadPermissionsData();
    } else {
      const error = await res.json();
      alert('Fehler: ' + (error.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    console.error('Error adding user to entity:', error);
    alert('Fehler beim Hinzufügen des Benutzers');
  }
}


async function removeEntityUser(entityId, userEmail) {
  if (!confirm(`Möchten Sie den Zugriff für diesen Benutzer wirklich entfernen?`)) return;

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/permissions/entity/${userEmail}?adminEmail=${currentUser.email}&entityId=${entityId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (res.ok) {
      await loadPermissionsData();
      // Reload entity users list
      document.getElementById('entity-selector').value = entityId;
      loadEntityUsers();
    } else {
      const error = await res.json();
      alert('Fehler: ' + (error.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    console.error('Error removing entity user:', error);
  }
}

// Open modal to add another manager/Geschäftsführer to an entity

