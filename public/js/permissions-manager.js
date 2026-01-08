/**
 * Hierarchical Permissions Manager
 * Handles user permissions, entity access, and role management
 */

// ==================================================
// PERMISSIONS LOGIC
// ==================================================

/**
 * Check if user can invite others based on their role
 * - Geschäftsführer can invite anyone
 * - Manager can invite for their entities only
 * - Employee cannot invite
 */
function canInviteUsers(currentUser, allEntities) {
  // Geschäftsführer can always invite
  if (currentUser.role === 'geschaeftsfuehrer') {
    return { canInvite: true, entities: allEntities, reason: 'Geschäftsführer' };
  }

  // Manager can invite for their entities
  const managedEntities = allEntities.filter(e =>
    e.manager === currentUser.email ||
    (e.managers && e.managers.includes(currentUser.email))
  );

  if (managedEntities.length > 0) {
    return { canInvite: true, entities: managedEntities, reason: 'Manager' };
  }

  // Employee cannot invite
  return { canInvite: false, entities: [], reason: 'Mitarbeiter' };
}

/**
 * Get entities accessible by current user
 * - Geschäftsführer sees all
 * - Manager sees their managed entities
 * - Employee sees entities they have access to
 */
function getAccessibleEntities(currentUser, allEntities, allPermissions) {
  // Geschäftsführer sees all
  if (currentUser.role === 'geschaeftsfuehrer') {
    return allEntities;
  }

  // Manager sees their entities
  const managedEntities = allEntities.filter(e =>
    e.manager === currentUser.email ||
    (e.managers && e.managers.includes(currentUser.email))
  );

  if (managedEntities.length > 0) {
    return managedEntities;
  }

  // Employee sees entities they have permission for
  const userPerms = allPermissions[currentUser.email] || {};
  const entityIds = Object.keys(userPerms);
  return allEntities.filter(e => entityIds.includes(e.id));
}

/**
 * Check if user can edit another user's permissions
 * - Geschäftsführer can edit anyone
 * - Manager can edit users in their entities
 * - Employee cannot edit
 */
function canEditUser(currentUser, targetUser, allEntities) {
  // Geschäftsführer can edit anyone
  if (currentUser.role === 'geschaeftsfuehrer') {
    return true;
  }

  // Cannot edit Geschäftsführer
  if (targetUser.role === 'geschaeftsfuehrer') {
    return false;
  }

  // Manager can edit users in their entities
  const managedEntities = allEntities.filter(e =>
    e.manager === currentUser.email ||
    (e.managers && e.managers.includes(currentUser.email))
  );

  if (managedEntities.length === 0) {
    return false;
  }

  // Check if target user has access to any of the managed entities
  const targetEntityIds = targetUser.entityIds || [];
  const managedEntityIds = managedEntities.map(e => e.id);

  return targetEntityIds.some(id => managedEntityIds.includes(id));
}

/**
 * Filter users visible to current user
 * - Geschäftsführer sees all users
 * - Manager sees users in their entities
 * - Employee sees no users (no management rights)
 */
function getVisibleUsers(currentUser, allUsers, allEntities) {
  // Geschäftsführer sees all
  if (currentUser.role === 'geschaeftsfuehrer') {
    return allUsers;
  }

  // Manager sees users in their entities
  const managedEntities = allEntities.filter(e =>
    e.manager === currentUser.email ||
    (e.managers && e.managers.includes(currentUser.email))
  );

  if (managedEntities.length === 0) {
    return [currentUser]; // Only see themselves
  }

  const managedEntityIds = managedEntities.map(e => e.id);

  return allUsers.filter(user => {
    // Always show self
    if (user.email === currentUser.email) return true;

    // Show users with access to managed entities
    const userEntityIds = user.entityIds || [];
    return userEntityIds.some(id => managedEntityIds.includes(id));
  });
}

/**
 * Get role badge HTML
 */
function getRoleBadge(role) {
  if (role === 'geschaeftsfuehrer') {
    return '<span class="badge badge-admin">Geschäftsführer</span>';
  } else if (role === 'manager') {
    return '<span class="badge badge-manager">Manager</span>';
  } else {
    return '<span class="badge badge-user">Mitarbeiter</span>';
  }
}

/**
 * Get module access display
 */
function getModuleAccessDisplay(user, modules) {
  if (user.role === 'geschaeftsfuehrer') {
    return '<span style="color:#059669;font-weight:600">✓ Vollzugriff auf alle Module</span>';
  }

  const perms = user.permissions || {};
  const accessibleModules = Object.keys(perms).filter(m => perms[m]?.view || perms[m]?.edit);

  if (accessibleModules.length === 0) {
    return '<span style="color:#9CA3AF">Kein Modulzugriff</span>';
  }

  return accessibleModules.map(m => {
    const mod = modules[m];
    const canEdit = perms[m]?.edit;
    const bgColor = canEdit ? '#D1FAE5' : '#DBEAFE';
    const textColor = canEdit ? '#065F46' : '#1E40AF';
    return `<span style="font-size:12px;padding:4px 8px;border-radius:6px;margin:2px;display:inline-block;background:${bgColor};color:${textColor}">${mod?.icon || ''} ${mod?.label || m}</span>`;
  }).join('');
}

/**
 * Get entity access display
 */
function getEntityAccessDisplay(user, allEntities) {
  if (user.role === 'geschaeftsfuehrer') {
    return '<span style="color:#059669">Alle Entitäten</span>';
  }

  const userEntityIds = user.entityIds || [];
  if (userEntityIds.length === 0) {
    return '<span style="color:#9CA3AF">Keine Entitäten</span>';
  }

  return userEntityIds.map(id => {
    const entity = allEntities.find(e => e.id === id);
    if (!entity) return null;

    const isManager = entity.manager === user.email ||
      (entity.managers && entity.managers.includes(user.email));

    const bgColor = isManager ? '#FEF3C7' : '#E0E7FF';
    const textColor = isManager ? '#92400E' : '#3730A3';
    const icon = isManager ? '👑' : '📁';

    return `<span style="font-size:12px;padding:4px 8px;border-radius:6px;margin:2px;display:inline-block;background:${bgColor};color:${textColor}">${icon} ${entity.name}</span>`;
  }).filter(Boolean).join('');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    canInviteUsers,
    getAccessibleEntities,
    canEditUser,
    getVisibleUsers,
    getRoleBadge,
    getModuleAccessDisplay,
    getEntityAccessDisplay
  };
}
