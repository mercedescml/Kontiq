/**
 * Hierarchical Permissions Manager v2
 *
 * MODÈLE DE PERMISSIONS AMÉLIORÉ :
 *
 * User Structure:
 * {
 *   email: string,
 *   name: string,
 *   role: 'geschaeftsfuehrer' | 'manager' | 'employee',
 *
 *   // Entités où l'utilisateur est MANAGER (peut inviter pour ces entités)
 *   managedEntityIds: string[],
 *
 *   // Entités auxquelles l'utilisateur a ACCÈS (lecture/écriture)
 *   accessibleEntityIds: string[],
 *
 *   // Permissions par module
 *   permissions: {
 *     moduleName: { view: boolean, edit: boolean }
 *   }
 * }
 *
 * HIÉRARCHIE :
 * - Geschäftsführer : Peut tout faire, peut inviter n'importe qui
 * - Manager : Peut inviter pour SES entités, peut créer Managers/Employees
 * - Employee : Ne peut pas inviter, accès limité
 */

// ==================================================
// PERMISSIONS LOGIC V2
// ==================================================

/**
 * Check if user is Geschäftsführer
 */
function isGeschaeftsfuehrer(user) {
  return user && user.role === 'geschaeftsfuehrer';
}

/**
 * Check if user is Manager
 */
function isManager(user) {
  return user && user.role === 'manager' && user.managedEntityIds && user.managedEntityIds.length > 0;
}

/**
 * Get roles that current user can assign
 * - Geschäftsführer can assign: Geschäftsführer, Manager, Employee
 * - Manager can assign: Manager, Employee
 * - Employee cannot assign
 */
function getAssignableRoles(currentUser) {
  if (isGeschaeftsfuehrer(currentUser)) {
    return [
      { value: 'geschaeftsfuehrer', label: 'Geschäftsführer', description: 'Voller Zugriff auf alles' },
      { value: 'manager', label: 'Manager', description: 'Verwaltet eine oder mehrere Entitäten' },
      { value: 'employee', label: 'Mitarbeiter', description: 'Eingeschränkter Zugriff' }
    ];
  }

  if (isManager(currentUser)) {
    return [
      { value: 'manager', label: 'Manager', description: 'Verwaltet eine oder mehrere Entitäten' },
      { value: 'employee', label: 'Mitarbeiter', description: 'Eingeschränkter Zugriff' }
    ];
  }

  return []; // Employee cannot invite
}

/**
 * Get entities that current user can assign to others
 * - Geschäftsführer: All entities
 * - Manager: Only their managed entities
 * - Employee: None
 */
function getAssignableEntities(currentUser, allEntities) {
  if (isGeschaeftsfuehrer(currentUser)) {
    return allEntities;
  }

  if (isManager(currentUser)) {
    const managedIds = currentUser.managedEntityIds || [];
    return allEntities.filter(e => managedIds.includes(e.id));
  }

  return [];
}

/**
 * Check if user can invite others
 */
function canInviteUsers(currentUser) {
  return isGeschaeftsfuehrer(currentUser) || isManager(currentUser);
}

/**
 * Check if user can edit another user's permissions
 * - Geschäftsführer: Can edit anyone
 * - Manager: Can edit users in their managed entities
 * - Employee: Cannot edit
 */
function canEditUser(currentUser, targetUser, allEntities) {
  // Geschäftsführer can edit anyone
  if (isGeschaeftsfuehrer(currentUser)) {
    return true;
  }

  // Manager can edit users in their entities
  if (isManager(currentUser)) {
    const managedIds = currentUser.managedEntityIds || [];
    const targetEntityIds = targetUser.accessibleEntityIds || [];

    // Check if any of target's entities are managed by current user
    return targetEntityIds.some(id => managedIds.includes(id));
  }

  return false;
}

/**
 * Get visible users for current user
 * - Geschäftsführer: Sees all users
 * - Manager: Sees users in their entities
 * - Employee: Sees only self
 */
function getVisibleUsers(currentUser, allUsers, allEntities) {
  if (isGeschaeftsfuehrer(currentUser)) {
    return allUsers;
  }

  if (isManager(currentUser)) {
    const managedIds = currentUser.managedEntityIds || [];

    return allUsers.filter(user => {
      // Always show self
      if (user.email === currentUser.email) return true;

      // Show Geschäftsführer
      if (isGeschaeftsfuehrer(user)) return true;

      // Show users with access to managed entities
      const userEntityIds = user.accessibleEntityIds || [];
      return userEntityIds.some(id => managedIds.includes(id));
    });
  }

  // Employee sees only themselves
  return allUsers.filter(u => u.email === currentUser.email);
}

/**
 * Get accessible entities for user
 * - Geschäftsführer: All entities
 * - Others: Only their accessible entities
 */
function getAccessibleEntities(user, allEntities) {
  if (isGeschaeftsfuehrer(user)) {
    return allEntities;
  }

  const accessibleIds = user.accessibleEntityIds || [];
  return allEntities.filter(e => accessibleIds.includes(e.id));
}

/**
 * Get managed entities for user
 * Only relevant for Managers
 */
function getManagedEntities(user, allEntities) {
  if (isGeschaeftsfuehrer(user)) {
    return allEntities; // GF manages all
  }

  const managedIds = user.managedEntityIds || [];
  return allEntities.filter(e => managedIds.includes(e.id));
}

/**
 * Build permission object for a new user
 */
function buildUserPermissions(role, selectedEntities, modulePermissions, managedEntityIds = []) {
  const user = {
    role: role,
    accessibleEntityIds: selectedEntities,
    permissions: modulePermissions
  };

  // Only add managedEntityIds for managers
  if (role === 'manager') {
    user.managedEntityIds = managedEntityIds;
  }

  // Geschäftsführer gets all permissions automatically
  if (role === 'geschaeftsfuehrer') {
    user.accessibleEntityIds = ['all']; // Special value meaning "all entities"
    user.permissions = {}; // Empty means all permissions
  }

  return user;
}

/**
 * Validate if current user can grant these permissions
 * - Geschäftsführer: Can grant anything
 * - Manager: Can only grant for their entities
 */
function canGrantPermissions(currentUser, targetRole, targetEntities, targetManagedEntities) {
  if (isGeschaeftsfuehrer(currentUser)) {
    return { valid: true };
  }

  if (isManager(currentUser)) {
    // Cannot create Geschäftsführer
    if (targetRole === 'geschaeftsfuehrer') {
      return { valid: false, reason: 'Manager können keine Geschäftsführer erstellen' };
    }

    const managedIds = currentUser.managedEntityIds || [];

    // Check if all target entities are within manager's scope
    const invalidEntities = targetEntities.filter(id => !managedIds.includes(id));
    if (invalidEntities.length > 0) {
      return { valid: false, reason: 'Sie können nur Zugriff auf Ihre eigenen Entitäten gewähren' };
    }

    // Check if target managed entities are within manager's scope
    if (targetManagedEntities && targetManagedEntities.length > 0) {
      const invalidManaged = targetManagedEntities.filter(id => !managedIds.includes(id));
      if (invalidManaged.length > 0) {
        return { valid: false, reason: 'Sie können nur Entitäten zuweisen, die Sie selbst verwalten' };
      }
    }

    return { valid: true };
  }

  return { valid: false, reason: 'Keine Berechtigung zum Erstellen von Benutzern' };
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
 * Get module permissions display
 */
function getModulePermissionsDisplay(user, modules) {
  if (isGeschaeftsfuehrer(user)) {
    return '<span style="color:#059669;font-weight:600;font-size:13px">✓ Vollzugriff</span>';
  }

  const perms = user.permissions || {};
  const keys = Object.keys(perms);

  if (keys.length === 0) {
    return '<span style="color:#9CA3AF;font-size:13px">Kein Zugriff</span>';
  }

  return keys.map(key => {
    const perm = perms[key];
    const module = modules[key];
    if (!module) return null;

    const icon = module.icon || '';
    const label = module.label || key;

    if (perm.edit) {
      return `<span style="font-size:11px;padding:3px 8px;border-radius:5px;margin:2px;display:inline-block;background:#D1FAE5;color:#065F46">${icon} ${label} <small>(Bearbeiten)</small></span>`;
    } else if (perm.view) {
      return `<span style="font-size:11px;padding:3px 8px;border-radius:5px;margin:2px;display:inline-block;background:#DBEAFE;color:#1E40AF">${icon} ${label} <small>(Lesen)</small></span>`;
    }
    return null;
  }).filter(Boolean).join(' ');
}

/**
 * Get entity access display
 */
function getEntityAccessDisplay(user, allEntities) {
  if (isGeschaeftsfuehrer(user)) {
    return '<span style="color:#059669;font-size:13px">Alle Entitäten</span>';
  }

  const accessibleIds = user.accessibleEntityIds || [];
  const managedIds = user.managedEntityIds || [];

  if (accessibleIds.length === 0) {
    return '<span style="color:#9CA3AF;font-size:13px">Keine Entitäten</span>';
  }

  return accessibleIds.map(id => {
    const entity = allEntities.find(e => e.id === id);
    if (!entity) return null;

    const isManaged = managedIds.includes(id);

    if (isManaged) {
      return `<span style="font-size:11px;padding:3px 8px;border-radius:5px;margin:2px;display:inline-block;background:#FEF3C7;color:#92400E">👑 ${entity.name}</span>`;
    } else {
      return `<span style="font-size:11px;padding:3px 8px;border-radius:5px;margin:2px;display:inline-block;background:#E0E7FF;color:#3730A3">📁 ${entity.name}</span>`;
    }
  }).filter(Boolean).join(' ');
}

// Export for browser
if (typeof window !== 'undefined') {
  window.PermissionsManager = {
    isGeschaeftsfuehrer,
    isManager,
    getAssignableRoles,
    getAssignableEntities,
    canInviteUsers,
    canEditUser,
    getVisibleUsers,
    getAccessibleEntities,
    getManagedEntities,
    buildUserPermissions,
    canGrantPermissions,
    getRoleBadge,
    getModulePermissionsDisplay,
    getEntityAccessDisplay
  };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isGeschaeftsfuehrer,
    isManager,
    getAssignableRoles,
    getAssignableEntities,
    canInviteUsers,
    canEditUser,
    getVisibleUsers,
    getAccessibleEntities,
    getManagedEntities,
    buildUserPermissions,
    canGrantPermissions,
    getRoleBadge,
    getModulePermissionsDisplay,
    getEntityAccessDisplay
  };
}
