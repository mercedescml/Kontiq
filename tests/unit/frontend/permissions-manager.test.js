/**
 * Permissions Manager Tests
 * Tests for frontend permissions logic
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Load the PermissionsManager class
const fs = require('fs');
const path = require('path');
const permissionsCode = fs.readFileSync(
  path.join(__dirname, '../../../public/js/permissions.js'),
  'utf8'
);

// Execute the code to define PermissionsManager
eval(permissionsCode);

describe('PermissionsManager', () => {
  let manager;

  beforeEach(() => {
    manager = new PermissionsManager();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('isGeschaeftsfuehrer()', () => {
    test('should return true for geschaeftsfuehrer role', () => {
      manager.permissions = {
        global: {
          role: 'geschaeftsfuehrer',
          permissions: {}
        }
      };

      expect(manager.isGeschaeftsfuehrer()).toBe(true);
    });

    test('should return false for employee role', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {}
        }
      };

      expect(manager.isGeschaeftsfuehrer()).toBe(false);
    });

    test('should return false when permissions not loaded', () => {
      manager.permissions = null;

      expect(manager.isGeschaeftsfuehrer()).toBe(false);
    });
  });

  describe('can()', () => {
    test('should return true for geschaeftsfuehrer on all modules', () => {
      manager.permissions = {
        global: {
          role: 'geschaeftsfuehrer',
          permissions: {}
        }
      };

      expect(manager.can('bankkonten', 'view')).toBe(true);
      expect(manager.can('kosten', 'edit')).toBe(true);
      expect(manager.can('forderungen', 'delete')).toBe(true);
      expect(manager.can('entitaeten', 'manage')).toBe(true);
    });

    test('should check global permissions for employees', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: true, edit: false },
            kosten: { view: true, edit: true }
          }
        }
      };

      expect(manager.can('bankkonten', 'view')).toBe(true);
      expect(manager.can('bankkonten', 'edit')).toBe(false);
      expect(manager.can('kosten', 'view')).toBe(true);
      expect(manager.can('kosten', 'edit')).toBe(true);
      expect(manager.can('forderungen', 'view')).toBe(false);
    });

    test('should check entity-specific permissions', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {}
        },
        entities: {
          'entity-1': {
            permissions: {
              bankkonten: { view: true, edit: false },
              kosten: { view: true, edit: true }
            }
          }
        }
      };

      expect(manager.can('bankkonten', 'view', 'entity-1')).toBe(true);
      expect(manager.can('bankkonten', 'edit', 'entity-1')).toBe(false);
      expect(manager.can('kosten', 'edit', 'entity-1')).toBe(true);
    });

    test('should prioritize entity permissions over global', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: false, edit: false }
          }
        },
        entities: {
          'entity-1': {
            permissions: {
              bankkonten: { view: true, edit: true }
            }
          }
        }
      };

      // Entity permission should override global
      expect(manager.can('bankkonten', 'view', 'entity-1')).toBe(true);
      expect(manager.can('bankkonten', 'edit', 'entity-1')).toBe(true);
    });

    test('should return false when permissions not loaded', () => {
      manager.permissions = null;

      expect(manager.can('bankkonten', 'view')).toBe(false);
    });
  });

  describe('canView()', () => {
    test('should check view permission', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: true, edit: false }
          }
        }
      };

      expect(manager.canView('bankkonten')).toBe(true);
    });
  });

  describe('canEdit()', () => {
    test('should check edit permission', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: true, edit: false },
            kosten: { view: true, edit: true }
          }
        }
      };

      expect(manager.canEdit('bankkonten')).toBe(false);
      expect(manager.canEdit('kosten')).toBe(true);
    });
  });

  describe('canDelete()', () => {
    test('should check delete permission', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: true, edit: true, delete: false },
            kosten: { view: true, edit: true, delete: true }
          }
        }
      };

      expect(manager.canDelete('bankkonten')).toBe(false);
      expect(manager.canDelete('kosten')).toBe(true);
    });
  });

  describe('getRole()', () => {
    test('should return current user role', () => {
      manager.permissions = {
        global: {
          role: 'geschaeftsfuehrer'
        }
      };

      expect(manager.getRole()).toBe('geschaeftsfuehrer');
    });

    test('should return "standard" if no role defined', () => {
      manager.permissions = {};

      expect(manager.getRole()).toBe('standard');
    });
  });

  describe('getViewableModules()', () => {
    test('should return all modules for geschaeftsfuehrer', () => {
      manager.permissions = {
        global: {
          role: 'geschaeftsfuehrer'
        }
      };

      const modules = manager.getViewableModules();

      expect(modules).toContain('entitaeten');
      expect(modules).toContain('bankkonten');
      expect(modules).toContain('kosten');
      expect(modules).toContain('forderungen');
      expect(modules).toContain('zahlungen');
      expect(modules).toContain('liquiditat');
      expect(modules).toContain('reports');
    });

    test('should return only permitted modules for employees', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: true },
            kosten: { view: true },
            forderungen: { view: false }
          }
        }
      };

      const modules = manager.getViewableModules();

      expect(modules).toContain('bankkonten');
      expect(modules).toContain('kosten');
      expect(modules).not.toContain('forderungen');
    });
  });

  describe('getAccessibleEntities()', () => {
    test('should return list of entity IDs', () => {
      manager.permissions = {
        entities: {
          'entity-1': {},
          'entity-2': {},
          'entity-3': {}
        }
      };

      const entities = manager.getAccessibleEntities();

      expect(entities).toHaveLength(3);
      expect(entities).toContain('entity-1');
      expect(entities).toContain('entity-2');
      expect(entities).toContain('entity-3');
    });

    test('should return empty array if no entities', () => {
      manager.permissions = {
        global: {}
      };

      const entities = manager.getAccessibleEntities();

      expect(entities).toEqual([]);
    });
  });

  describe('filterNavigation()', () => {
    test('should filter navigation items based on permissions', () => {
      manager.permissions = {
        global: {
          role: 'employee',
          permissions: {
            bankkonten: { view: true },
            kosten: { view: false }
          }
        }
      };

      const navItems = [
        { name: 'Dashboard', module: null },
        { name: 'Bank Accounts', module: 'bankkonten' },
        { name: 'Costs', module: 'kosten' },
        { name: 'Settings', module: null }
      ];

      const filtered = manager.filterNavigation(navItems);

      expect(filtered).toHaveLength(3);
      expect(filtered.find(i => i.name === 'Dashboard')).toBeDefined();
      expect(filtered.find(i => i.name === 'Bank Accounts')).toBeDefined();
      expect(filtered.find(i => i.name === 'Costs')).toBeUndefined();
      expect(filtered.find(i => i.name === 'Settings')).toBeDefined();
    });
  });
});
