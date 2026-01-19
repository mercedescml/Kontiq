/**
 * Kontiq Permissions Manager
 * Système de gestion des permissions granulaires
 */

class PermissionsManager {
  constructor() {
    this.currentUser = null;
    this.permissions = null;
    this.API_BASE = '';
  }

  /**
   * Initialize permissions for current user
   */
  async init() {
    const userData = localStorage.getItem('kontiq_user');
    if (!userData) {
      throw new Error('User not logged in');
    }

    this.currentUser = JSON.parse(userData);
    await this.loadPermissions();
    return this.permissions;
  }

  /**
   * Load permissions from server
   */
  async loadPermissions() {
    try {
      const res = await fetch(`${this.API_BASE}/api/permissions/user/${this.currentUser.email}`);
      if (res.ok) {
        const data = await res.json();
        this.permissions = data.permissions;
        localStorage.setItem('userPermissions', JSON.stringify(this.permissions));
        return this.permissions;
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('userPermissions');
      if (cached) {
        this.permissions = JSON.parse(cached);
      }
    }
    return this.permissions;
  }

  /**
   * Check if user has permission for a module
   * @param {string} module - Module name (e.g., 'bankkonten', 'kosten')
   * @param {string} action - Action type ('view' or 'edit')
   * @param {string} entityId - Optional entity ID for entity-specific permissions
   * @returns {boolean}
   */
  can(module, action = 'view', entityId = null) {
    if (!this.permissions) {
      console.warn('Permissions not loaded');
      return false;
    }

    // Check if user is Geschäftsführer (full access)
    if (this.permissions.global?.role === 'geschaeftsfuehrer') {
      return true;
    }

    // Check entity-specific permissions first
    if (entityId && this.permissions.entities[entityId]) {
      const entityPerms = this.permissions.entities[entityId].permissions;
      if (entityPerms && entityPerms[module] && entityPerms[module][action]) {
        return true;
      }
    }

    // Check global permissions
    if (this.permissions.global?.permissions) {
      const modulePerms = this.permissions.global.permissions[module];
      if (modulePerms && modulePerms[action]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user can view a module
   */
  canView(module, entityId = null) {
    return this.can(module, 'view', entityId);
  }

  /**
   * Check if user can edit a module
   */
  canEdit(module, entityId = null) {
    return this.can(module, 'edit', entityId);
  }

  /**
   * Check if user can delete in a module
   */
  canDelete(module, entityId = null) {
    return this.can(module, 'delete', entityId);
  }

  /**
   * Check if user can manage entities
   */
  canManageEntities() {
    return this.can('entitaeten', 'manage');
  }

  /**
   * Check if user is Geschäftsführer
   */
  isGeschaeftsfuehrer() {
    return this.permissions?.global?.role === 'geschaeftsfuehrer';
  }

  /**
   * Check if user is manager
   */
  isManager() {
    return this.permissions?.global?.role === 'manager';
  }

  /**
   * Get user role
   */
  getRole() {
    return this.permissions?.global?.role || 'standard';
  }

  /**
   * Get all modules user can view
   */
  getViewableModules() {
    const modules = [];
    
    if (this.isGeschaeftsfuehrer()) {
      return ['entitaeten', 'bankkonten', 'kosten', 'forderungen', 'zahlungen', 'vertrage', 'liquiditat', 'reports', 'kpis', 'einstellungen'];
    }

    if (this.permissions?.global?.permissions) {
      Object.keys(this.permissions.global.permissions).forEach(module => {
        if (this.permissions.global.permissions[module].view) {
          modules.push(module);
        }
      });
    }

    return modules;
  }

  /**
   * Get entities user has access to
   */
  getAccessibleEntities() {
    if (!this.permissions?.entities) {
      return [];
    }
    return Object.keys(this.permissions.entities);
  }

  /**
   * Filter navigation items based on permissions
   * @param {Array} navItems - Array of navigation items
   * @returns {Array} Filtered navigation items
   */
  filterNavigation(navItems) {
    return navItems.filter(item => {
      if (!item.module) return true; // Always show items without module restriction
      return this.canView(item.module);
    });
  }

  /**
   * Apply permissions to UI elements
   * Hides elements user doesn't have permission for
   */
  applyToUI() {
    // Hide edit buttons if user can't edit
    document.querySelectorAll('[data-permission-edit]').forEach(el => {
      const module = el.getAttribute('data-permission-edit');
      const entityId = el.getAttribute('data-entity-id');
      if (!this.canEdit(module, entityId)) {
        el.style.display = 'none';
      }
    });

    // Hide delete buttons if user can't delete
    document.querySelectorAll('[data-permission-delete]').forEach(el => {
      const module = el.getAttribute('data-permission-delete');
      const entityId = el.getAttribute('data-entity-id');
      if (!this.canDelete(module, entityId)) {
        el.style.display = 'none';
      }
    });

    // Disable inputs if user can't edit
    document.querySelectorAll('[data-permission-input]').forEach(el => {
      const module = el.getAttribute('data-permission-input');
      const entityId = el.getAttribute('data-entity-id');
      if (!this.canEdit(module, entityId)) {
        el.disabled = true;
        el.style.opacity = '0.6';
        el.style.cursor = 'not-allowed';
      }
    });

    // Hide entire sections if user can't view
    document.querySelectorAll('[data-permission-view]').forEach(el => {
      const module = el.getAttribute('data-permission-view');
      const entityId = el.getAttribute('data-entity-id');
      if (!this.canView(module, entityId)) {
        el.style.display = 'none';
      }
    });
  }

  /**
   * Show permission error message
   */
  showPermissionError(action = 'diese Aktion durchführen') {
    alert(`Sie haben keine Berechtigung, um ${action}. Bitte kontaktieren Sie Ihren Administrator.`);
  }

  /**
   * Check permission and show error if not allowed
   * @returns {boolean}
   */
  requirePermission(module, action = 'view', entityId = null) {
    const hasPermission = this.can(module, action, entityId);
    if (!hasPermission) {
      this.showPermissionError(`auf ${module} zuzugreifen`);
    }
    return hasPermission;
  }
}

// Create global instance
const permissionsManager = new PermissionsManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PermissionsManager;
}
