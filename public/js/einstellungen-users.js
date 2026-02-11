/**
 * einstellungen-users.js
 *
 * Gestion des utilisateurs et permissions dans la section Einstellungen
 * - Chargement et affichage des utilisateurs
 * - Invitation de nouveaux utilisateurs avec permissions hiérarchiques
 * - Édition des permissions existantes
 * - Intégration avec PermissionsManager pour la validation
 */

/**
 * Charge les données de permissions et utilisateurs depuis l'API
 */
async function loadPermissionsData() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#6B7280;padding:40px">Lade Daten...</td></tr>';

  try {
    // Load permissions
    const url = `/api/permissions/all?email=${encodeURIComponent(currentUser.email)}`;
    const token = localStorage.getItem('token');

    const permsRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!permsRes.ok) {
      throw new Error(`HTTP ${permsRes.status}: ${permsRes.statusText}`);
    }

    const data = await permsRes.json();

    allUsers = data.users || [];
    allPermissions = data.entityPermissions || {};

    // Check if current user is Geschäftsführer
    const myPerms = allUsers.find(u => u.email === currentUser.email);
    isGeschaeftsfuehrer = myPerms?.globalPermissions?.role === 'geschaeftsfuehrer';
    
    // Update stats
    document.getElementById('stat-users').textContent = allUsers.length;
    
    // Populate table
    populateUsersTable();
    
    // Load entities - only for current user
    const entitiesRes = await fetch(`/api/entitaeten?email=${encodeURIComponent(currentUser.email)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (entitiesRes.ok) {
      const entData = await entitiesRes.json();
      allEntities = entData.entitaeten || [];
      // Filter entities where current user is a manager (supports multi-manager)
      managedEntities = allEntities.filter(e => isManagerOf(e, currentUser.email));
      document.getElementById('stat-entities').textContent = allEntities.length;
      populateEntitiesList();
    }
    
  } catch (error) {
    console.error('Error loading data:', error);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#DC2626;padding:40px">Fehler beim Laden: ${error.message}</td></tr>`;
  }
}


function populateUsersTable() {
  const tbody = document.getElementById('users-tbody');

  if (!tbody) {
    console.error('users-tbody not found!');
    return;
  }

  // Show/hide invite button based on permissions
  const inviteBtn = document.getElementById('invite-user-btn');
  if (inviteBtn && PermissionsManager.canInviteUsers(currentUser)) {
    inviteBtn.style.display = 'inline-flex';
  }

  if (!allUsers || allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#6B7280;padding:40px">Keine Benutzer gefunden</td></tr>';
    return;
  }

  // Get visible users based on current user's permissions
  const visibleUsers = PermissionsManager.getVisibleUsers(currentUser, allUsers, allEntities);

  const html = visibleUsers.map(user => {
    const perms = user.globalPermissions || {};
    const userWithStructure = {
      ...user,
      role: perms.role || 'employee',
      managedEntityIds: perms.managedEntityIds || [],
      accessibleEntityIds: perms.accessibleEntityIds || [],
      permissions: perms.permissions || {}
    };

    const isGF = PermissionsManager.isGeschaeftsfuehrer(userWithStructure);
    const isManager = PermissionsManager.isManager(userWithStructure);

    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

    // Use PermissionsManager display functions
    const moduleDisplay = PermissionsManager.getModulePermissionsDisplay(userWithStructure, MODULES);
    const entityDisplay = PermissionsManager.getEntityAccessDisplay(userWithStructure, allEntities);
    const roleBadge = PermissionsManager.getRoleBadge(userWithStructure.role);

    // Check if current user can edit this user
    const canEdit = PermissionsManager.canEditUser(currentUser, userWithStructure, allEntities);

    return `
      <tr>
        <td>
          <div class="user-row">
            <div class="user-avatar" style="background:${isGF ? '#059669' : isManager ? '#6366F1' : '#6B7280'};color:white">${initials}</div>
            <div class="user-info">
              <div class="user-name">${user.name || 'Unbekannt'} ${isGF ? '👑' : isManager ? '⭐' : ''}</div>
              <div class="user-email">${user.email}</div>
              <div style="margin-top:4px">${roleBadge}</div>
            </div>
          </div>
        </td>
        <td style="max-width:300px">${moduleDisplay}</td>
        <td>${entityDisplay}</td>
        <td>
          <div class="actions">
            ${canEdit ? `
              <button class="btn btn-sm" style="background:#0EB17A;color:white" onclick="editUserPermissions('${user.email}')">
                🔐 Rechte bearbeiten
              </button>
            ` : user.email === currentUser.email ? '<span style="color:#6B7280;font-size:12px">Sie selbst</span>' : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = html;
}


function openInviteModal() {
  if (!window.PermissionsManager) {
    alert('PermissionsManager nicht geladen');
    return;
  }

  // Check if user can invite
  if (!PermissionsManager.canInviteUsers(currentUser)) {
    alert('Sie haben keine Berechtigung zum Einladen von Benutzern');
    return;
  }

  document.getElementById('invite-modal').classList.add('active');

  // Populate role dropdown based on current user's permissions
  const roleSelect = document.getElementById('invite-role');
  const assignableRoles = PermissionsManager.getAssignableRoles(currentUser);

  roleSelect.innerHTML = '<option value="">Bitte wählen...</option>';
  assignableRoles.forEach(role => {
    roleSelect.innerHTML += `<option value="${role.value}">${role.label} - ${role.description}</option>`;
  });

  // Reset form
  document.getElementById('invite-email').value = '';
  document.getElementById('invite-firstname').value = '';
  document.getElementById('invite-lastname').value = '';
  document.getElementById('entities-access-group').style.display = 'none';
  document.getElementById('modules-access-group').style.display = 'none';
}


function closeInviteModal() {
  document.getElementById('invite-modal').classList.remove('active');
}

// Update invite modal based on selected role

function updateInvitePermissions() {
  const role = document.getElementById('invite-role').value;
  const entitiesGroup = document.getElementById('entities-access-group');
  const modulesGroup = document.getElementById('modules-access-group');
  const roleDesc = document.getElementById('role-description');

  if (!role) {
    entitiesGroup.style.display = 'none';
    modulesGroup.style.display = 'none';
    roleDesc.textContent = '';
    return;
  }

  // Geschäftsführer gets everything automatically
  if (role === 'geschaeftsfuehrer') {
    entitiesGroup.style.display = 'none';
    modulesGroup.style.display = 'none';
    roleDesc.innerHTML = '<span style="color:#059669;font-weight:600">✓ Vollzugriff auf alle Entitäten und Module</span>';
    return;
  }

  // For Manager and Employee, show entity and module selection
  entitiesGroup.style.display = 'block';
  modulesGroup.style.display = 'block';

  // Populate entities (only those current user can assign)
  const assignableEntities = PermissionsManager.getAssignableEntities(currentUser, allEntities);
  const entitiesContainer = document.getElementById('invite-entities-container');

  if (assignableEntities.length === 0) {
    entitiesContainer.innerHTML = '<div style="color:#DC2626;padding:12px;background:#FEE2E2;border-radius:8px">Sie haben keine Entitäten, die Sie zuweisen können.</div>';
  } else {
    let html = '';

    // For managers, show distinction between "accessible" and "managed"
    if (role === 'manager') {
      html += '<div style="margin-bottom:16px">';
      html += '<div style="font-weight:600;font-size:14px;color:#0A2540;margin-bottom:8px">Entitäten die dieser Manager verwalten kann (👑):</div>';
      html += '<div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:12px;margin-bottom:12px">';
      html += '<div style="font-size:13px;color:#92400E;margin-bottom:12px">Der Manager kann Benutzer für diese Entitäten einladen und verwalten.</div>';

      assignableEntities.forEach(entity => {
        html += `
          <label class="checkbox-item">
            <input type="checkbox" class="invite-managed-entity" data-entity-id="${entity.id}">
            <div style="flex:1">
              <div class="checkbox-label">👑 ${entity.name}</div>
              <div class="checkbox-desc">Manager-Rechte für diese Entität</div>
            </div>
          </label>
        `;
      });
      html += '</div>';

      html += '<div style="font-weight:600;font-size:14px;color:#0A2540;margin-bottom:8px">Zusätzliche Entitäten mit Zugriff (📁):</div>';
      html += '<div style="font-size:13px;color:#6B7280;margin-bottom:8px">Optional: Weitere Entitäten, die der Manager sehen/bearbeiten kann (ohne Management-Rechte).</div>';
    } else {
      html += '<div style="font-size:13px;color:#6B7280;margin-bottom:12px">Wählen Sie die Entitäten aus, auf die der Mitarbeiter zugreifen kann.</div>';
    }

    assignableEntities.forEach(entity => {
      html += `
        <label class="checkbox-item">
          <input type="checkbox" class="invite-accessible-entity" data-entity-id="${entity.id}">
          <div style="flex:1">
            <div class="checkbox-label">📁 ${entity.name}</div>
            <div class="checkbox-desc">${role === 'manager' ? 'Nur Zugriff (keine Management-Rechte)' : 'Zugriff auf diese Entität'}</div>
          </div>
        </label>
      `;
    });

    if (role === 'manager') {
      html += '</div>';
    }

    entitiesContainer.innerHTML = html;
  }

  // Populate modules with view/edit options
  const modulesContainer = document.getElementById('invite-modules-container');
  let modulesHtml = '<div style="display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px">';

  Object.keys(MODULES).forEach(moduleKey => {
    const module = MODULES[moduleKey];
    const isSensitive = module.sensitive === true;

    modulesHtml += `
      <div style="border:${isSensitive ? '2px solid #F59E0B' : '1px solid #E5E7EB'};border-radius:8px;padding:12px;${isSensitive ? 'background:#FFFBEB' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
          <div>
            <div style="font-weight:600;font-size:14px">${module.icon} ${module.label}</div>
            <div style="font-size:12px;color:#6B7280">${module.description || ''}</div>
          </div>
          ${isSensitive ? '<span style="font-size:10px;background:#F59E0B;color:white;padding:2px 6px;border-radius:4px;font-weight:600">SENSIBEL</span>' : ''}
        </div>
        <div style="display:flex;gap:16px">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input type="checkbox" class="invite-module-view" data-module="${moduleKey}" style="accent-color:#0EB17A;width:16px;height:16px">
            👁️ Ansehen
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input type="checkbox" class="invite-module-edit" data-module="${moduleKey}" style="accent-color:#0EB17A;width:16px;height:16px">
            ✏️ Bearbeiten
          </label>
        </div>
      </div>
    `;
  });

  modulesHtml += '</div>';
  modulesContainer.innerHTML = modulesHtml;

  // Update role description
  if (role === 'manager') {
    roleDesc.innerHTML = '<span style="color:#6366F1">Als Manager kann dieser Benutzer weitere Benutzer einladen und Entitäten verwalten.</span>';
  } else if (role === 'employee') {
    roleDesc.innerHTML = '<span style="color:#6B7280">Als Mitarbeiter hat dieser Benutzer nur Zugriff auf zugewiesene Entitäten und Module.</span>';
  }
}


async function sendInvite(event) {
  if (event) event.preventDefault();

  const email = document.getElementById('invite-email').value.trim();
  const firstname = document.getElementById('invite-firstname').value.trim();
  const lastname = document.getElementById('invite-lastname').value.trim();
  const role = document.getElementById('invite-role').value;

  if (!email || !firstname || !lastname || !role) {
    alert('Bitte füllen Sie alle Pflichtfelder aus');
    return;
  }

  // Check if user can invite
  if (!PermissionsManager.canInviteUsers(currentUser)) {
    alert('Sie haben keine Berechtigung zum Einladen von Benutzern');
    return;
  }

  // Collect accessible entities
  const accessibleEntityIds = [];
  document.querySelectorAll('.invite-accessible-entity:checked').forEach(checkbox => {
    accessibleEntityIds.push(checkbox.dataset.entityId);
  });

  // Collect managed entities (for managers only)
  const managedEntityIds = [];
  if (role === 'manager') {
    document.querySelectorAll('.invite-managed-entity:checked').forEach(checkbox => {
      managedEntityIds.push(checkbox.dataset.entityId);
    });

    // Managed entities should also be accessible
    managedEntityIds.forEach(id => {
      if (!accessibleEntityIds.includes(id)) {
        accessibleEntityIds.push(id);
      }
    });
  }

  // Collect module permissions (view/edit)
  const modulePermissions = {};
  Object.keys(MODULES).forEach(moduleKey => {
    const viewCheckbox = document.querySelector(`.invite-module-view[data-module="${moduleKey}"]`);
    const editCheckbox = document.querySelector(`.invite-module-edit[data-module="${moduleKey}"]`);

    if (viewCheckbox?.checked || editCheckbox?.checked) {
      modulePermissions[moduleKey] = {
        view: viewCheckbox?.checked || false,
        edit: editCheckbox?.checked || false
      };
    }
  });

  // Validate with PermissionsManager
  const validation = PermissionsManager.canGrantPermissions(
    currentUser,
    role,
    accessibleEntityIds,
    managedEntityIds
  );

  if (!validation.valid) {
    alert('Fehler: ' + validation.reason);
    return;
  }

  // Build user permissions object
  const userPermissions = PermissionsManager.buildUserPermissions(
    role,
    accessibleEntityIds,
    modulePermissions,
    managedEntityIds
  );

  try {
    // Create user with hierarchical permissions
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/users/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminEmail: currentUser.email,
        targetEmail: email,
        firstName: firstname,
        lastName: lastname,
        name: `${firstname} ${lastname}`,
        ...userPermissions
      })
    });

    if (res.ok) {
      let message = `✅ Benutzer ${email} wurde erfolgreich eingeladen!\n\n`;
      message += `Rolle: ${role === 'geschaeftsfuehrer' ? 'Geschäftsführer' : role === 'manager' ? 'Manager' : 'Mitarbeiter'}\n`;

      if (managedEntityIds.length > 0) {
        message += `\n👑 Verwaltet ${managedEntityIds.length} Entität(en)`;
      }
      if (accessibleEntityIds.length > 0) {
        message += `\n📁 Zugriff auf ${accessibleEntityIds.length} Entität(en)`;
      }
      if (Object.keys(modulePermissions).length > 0) {
        message += `\n📊 Zugriff auf ${Object.keys(modulePermissions).length} Module`;
      }

      alert(message);
      closeInviteModal();

      // Reset form
      document.getElementById('invite-email').value = '';
      document.getElementById('invite-firstname').value = '';
      document.getElementById('invite-lastname').value = '';
      document.getElementById('invite-role').value = '';

      loadPermissionsData();
    } else {
      const error = await res.json();
      alert('❌ Fehler: ' + (error.error || 'Benutzer konnte nicht erstellt werden'));
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    alert('❌ Fehler beim Erstellen des Benutzers: ' + error.message);
  }
}


function editUserPermissions(email) {
  // Check if current user can edit this user
  const targetUser = allUsers.find(u => u.email === email);
  if (!targetUser) return;

  if (!PermissionsManager.canEditUser(currentUser, targetUser, allEntities)) {
    alert('Sie haben keine Berechtigung, diesen Benutzer zu bearbeiten.');
    return;
  }

  const perms = targetUser.globalPermissions || {};
  const role = perms.role || 'employee';
  const managedEntityIds = perms.managedEntityIds || [];
  const accessibleEntityIds = perms.accessibleEntityIds || [];
  const modulePerms = perms.permissions || {};

  const assignableRoles = PermissionsManager.getAssignableRoles(currentUser);
  const assignableEntities = PermissionsManager.getAssignableEntities(currentUser, allEntities);

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'edit-perms-modal';

  modal.innerHTML = `
    <div class="modal-content" style="max-width:900px;max-height:90vh;overflow-y:auto">
      <div class="modal-header">
        <div>
          <h3>🔐 Berechtigungen bearbeiten</h3>
          <p><strong>${targetUser.name}</strong> (${targetUser.email})</p>
        </div>
        <button class="close-modal" onclick="closeEditPermsModal()">×</button>
      </div>

      <!-- Role Selection -->
      <div class="form-group">
        <label class="label">Rolle *</label>
        <select class="select" id="edit-user-role" onchange="updateEditPermissions()">
          ${assignableRoles.map(r => `
            <option value="${r.value}" ${role === r.value ? 'selected' : ''}>${r.label} - ${r.description}</option>
          `).join('')}
        </select>
      </div>

      <div id="edit-role-description" style="margin-top:8px"></div>

      <!-- Entities (for Manager/Employee) -->
      <div class="form-group" id="edit-entities-group" style="${role === 'geschaeftsfuehrer' ? 'display:none' : ''}">
        <label class="label">Entitäten-Zugriff</label>

        ${role === 'manager' ? `
          <div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;color:#0A2540;margin-bottom:8px">👑 Verwaltete Entitäten (Manager-Rechte):</div>
            <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:12px;margin-bottom:12px">
              <div style="font-size:13px;color:#92400E;margin-bottom:12px">Der Manager kann Benutzer für diese Entitäten einladen.</div>
              ${assignableEntities.map(entity => `
                <label class="checkbox-item">
                  <input type="checkbox" class="edit-managed-entity" data-entity-id="${entity.id}" ${managedEntityIds.includes(entity.id) ? 'checked' : ''}>
                  <div style="flex:1">
                    <div class="checkbox-label">👑 ${entity.name}</div>
                  </div>
                </label>
              `).join('')}
            </div>

            <div style="font-weight:600;font-size:14px;color:#0A2540;margin-bottom:8px">📁 Zusätzliche Entitäten (nur Zugriff):</div>
            <div style="font-size:13px;color:#6B7280;margin-bottom:8px">Optional: Weitere Entitäten ohne Management-Rechte.</div>
          </div>
        ` : '<div style="font-size:13px;color:#6B7280;margin-bottom:12px">Wählen Sie die Entitäten aus, auf die der Benutzer zugreifen kann.</div>'}

        ${assignableEntities.map(entity => `
          <label class="checkbox-item">
            <input type="checkbox" class="edit-accessible-entity" data-entity-id="${entity.id}" ${accessibleEntityIds.includes(entity.id) ? 'checked' : ''}>
            <div style="flex:1">
              <div class="checkbox-label">📁 ${entity.name}</div>
            </div>
          </label>
        `).join('')}
      </div>

      <!-- Module Permissions -->
      <div class="form-group" id="edit-modules-group" style="${role === 'geschaeftsfuehrer' ? 'display:none' : ''}">
        <label class="label">Modul-Berechtigungen</label>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px">
          ${Object.keys(MODULES).map(moduleKey => {
            const module = MODULES[moduleKey];
            const modulePerm = modulePerms[moduleKey] || {};
            const isSensitive = module.sensitive === true;
            return `
              <div style="border:${isSensitive ? '2px solid #F59E0B' : '1px solid #E5E7EB'};border-radius:12px;padding:14px;${isSensitive ? 'background:#FFFBEB' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                  <div>
                    <div style="font-weight:600;font-size:14px">${module.icon} ${module.label}</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px">${module.description || ''}</div>
                  </div>
                  ${isSensitive ? '<span style="font-size:10px;background:#F59E0B;color:white;padding:2px 6px;border-radius:4px;font-weight:600">SENSIBEL</span>' : ''}
                </div>
                <div style="display:flex;gap:16px;margin-top:10px">
                  <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                    <input type="checkbox" class="edit-module-view" data-module="${moduleKey}" ${modulePerm.view ? 'checked' : ''} style="accent-color:#0EB17A;width:16px;height:16px">
                    👁️ Ansehen
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                    <input type="checkbox" class="edit-module-edit" data-module="${moduleKey}" ${modulePerm.edit ? 'checked' : ''} style="accent-color:#0EB17A;width:16px;height:16px">
                    ✏️ Bearbeiten
                  </label>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeEditPermsModal()">Abbrechen</button>
        <button class="btn btn-success" onclick="saveUserPermissions('${email}')">Speichern</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Update description initially
  updateEditPermissions();
}

// Update edit modal when role changes

function updateEditPermissions() {
  const role = document.getElementById('edit-user-role')?.value;
  if (!role) return;

  const entitiesGroup = document.getElementById('edit-entities-group');
  const modulesGroup = document.getElementById('edit-modules-group');
  const roleDesc = document.getElementById('edit-role-description');

  if (role === 'geschaeftsfuehrer') {
    entitiesGroup.style.display = 'none';
    modulesGroup.style.display = 'none';
    roleDesc.innerHTML = '<div style="padding:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;color:#059669;font-weight:600">✓ Geschäftsführer hat Vollzugriff auf alle Entitäten und Module</div>';
  } else {
    entitiesGroup.style.display = 'block';
    modulesGroup.style.display = 'block';

    if (role === 'manager') {
      roleDesc.innerHTML = '<div style="padding:12px;background:#EEF2FF;border:1px solid#C7D2FE;border-radius:8px;color:#4338CA">ℹ️ Manager können weitere Benutzer einladen und Entitäten verwalten</div>';
    } else {
      roleDesc.innerHTML = '<div style="padding:12px;background:#F3F4F6;border:1px solid #E5E7EB;border-radius:8px;color:#6B7280">ℹ️ Mitarbeiter haben Zugriff auf zugewiesene Entitäten und Module</div>';
    }
  }
}


async function saveUserPermissions(email) {
  const role = document.getElementById('edit-user-role')?.value;
  if (!role) {
    alert('Bitte wählen Sie eine Rolle aus');
    return;
  }

  // Collect accessible entities
  const accessibleEntityIds = [];
  document.querySelectorAll('.edit-accessible-entity:checked').forEach(checkbox => {
    accessibleEntityIds.push(checkbox.dataset.entityId);
  });

  // Collect managed entities (for managers only)
  const managedEntityIds = [];
  if (role === 'manager') {
    document.querySelectorAll('.edit-managed-entity:checked').forEach(checkbox => {
      managedEntityIds.push(checkbox.dataset.entityId);
    });

    // Managed entities should also be accessible
    managedEntityIds.forEach(id => {
      if (!accessibleEntityIds.includes(id)) {
        accessibleEntityIds.push(id);
      }
    });
  }

  // Collect module permissions (view/edit)
  const modulePermissions = {};
  Object.keys(MODULES).forEach(moduleKey => {
    const viewCheckbox = document.querySelector(`.edit-module-view[data-module="${moduleKey}"]`);
    const editCheckbox = document.querySelector(`.edit-module-edit[data-module="${moduleKey}"]`);

    if (viewCheckbox?.checked || editCheckbox?.checked) {
      modulePermissions[moduleKey] = {
        view: viewCheckbox?.checked || false,
        edit: editCheckbox?.checked || false
      };
    }
  });

  // Validate with PermissionsManager
  const validation = PermissionsManager.canGrantPermissions(
    currentUser,
    role,
    accessibleEntityIds,
    managedEntityIds
  );

  if (!validation.valid) {
    alert('Fehler: ' + validation.reason);
    return;
  }

  // Build user permissions object
  const userPermissions = PermissionsManager.buildUserPermissions(
    role,
    accessibleEntityIds,
    modulePermissions,
    managedEntityIds
  );

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/permissions/global`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminEmail: currentUser.email,
        targetEmail: email,
        permissions: userPermissions
      })
    });

    if (res.ok) {
      alert('✅ Berechtigungen erfolgreich gespeichert');
      closeEditPermsModal();
      loadPermissionsData();
    } else {
      const error = await res.json();
      alert('❌ Fehler: ' + (error.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    console.error('Error saving permissions:', error);
    alert('❌ Fehler beim Speichern der Berechtigungen');
  }
}


function closeEditPermsModal() {
  const modal = document.getElementById('edit-perms-modal');
  if (modal) modal.remove();
}

// Entity permissions - Manager can define for their entity

