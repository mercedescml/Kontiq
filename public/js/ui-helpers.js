/**
 * UI Helpers - Fonctions utilitaires pour l'interface
 * Combine: clickability-fixer, close-button-fixer, form-harmonizer
 */

const UIHelpers = {
  /**
   * Initialise tous les helpers UI
   */
  init() {
    this.setupButtons();
    this.setupModals();
    this.setupForms();
  },

  /**
   * Configure les boutons avec feedback visuel
   */
  setupButtons() {
    document.querySelectorAll('button, .btn').forEach(btn => {
      // S'assurer que les boutons sont cliquables
      if (btn.style.pointerEvents === 'none') {
        btn.style.pointerEvents = 'auto';
      }
    });
  },

  /**
   * Configure les modales
   */
  setupModals() {
    // Ajouter les boutons de fermeture manquants
    document.querySelectorAll('.modal, [id*="modal"], [id*="Modal"]').forEach(modal => {
      const header = modal.querySelector('.modal-header, [class*="modal-header"]');
      if (!header) return;

      // Vérifier s'il y a déjà un bouton close
      const hasClose = header.querySelector('.close-modal, [class*="close"]');
      if (hasClose) return;

      // Créer le bouton fermer
      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-modal';
      closeBtn.innerHTML = '×';
      closeBtn.type = 'button';
      closeBtn.style.cssText = `
        background: none; border: none; font-size: 24px; cursor: pointer;
        color: #6B7280; padding: 8px; border-radius: 6px;
      `;
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const parentModal = closeBtn.closest('[class*="modal"]');
        if (parentModal) {
          parentModal.classList.remove('active');
          parentModal.style.display = 'none';
        }
        if (typeof ModalManager !== 'undefined') {
          ModalManager.close(parentModal);
        }
      });
      header.appendChild(closeBtn);
    });
  },

  /**
   * Harmonise les formulaires
   */
  setupForms() {
    // Ajouter les classes appropriées aux inputs
    document.querySelectorAll('input:not([class]), textarea:not([class]), select:not([class])').forEach(el => {
      el.classList.add(el.tagName === 'SELECT' ? 'form-select' : 'form-input');
    });
  }
};

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  UIHelpers.init();
});

// Réinitialiser après chaque navigation
if (typeof APP !== 'undefined' && APP.executeViewScripts) {
  const originalFn = APP.executeViewScripts;
  APP.executeViewScripts = function(view) {
    originalFn.call(this, view);
    setTimeout(() => UIHelpers.init(), 100);
  };
}
