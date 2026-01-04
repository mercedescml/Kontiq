/**
 * Modal Manager - Harmonized Modal System
 * Gestion unifiée des modales dans toute l'application
 */

const ModalManager = {
  openModals: [],

  /**
   * Ouvre une modale
   */
  open(selector) {
    const modal = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    if (!modal) return;
    
    // Ajouter la classe active
    modal.classList.add('active');
    this.openModals.push(modal);
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
    
    // Focus sur le premier input
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  /**
   * Ferme une modale
   */
  close(selector) {
    const modal = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    if (!modal) return;
    
    modal.classList.remove('active');
    this.openModals = this.openModals.filter(m => m !== modal);
    
    // Rétablir le scroll si aucune modale ouverte
    if (this.openModals.length === 0) {
      document.body.style.overflow = '';
    }
  },

  /**
   * Ferme toutes les modales
   */
  closeAll() {
    this.openModals.forEach(modal => {
      modal.classList.remove('active');
    });
    this.openModals = [];
    document.body.style.overflow = '';
  },

  /**
   * Configure les fermetures au clic sur l'overlay
   */
  setupOverlayClosing() {
    document.querySelectorAll('[class*="modal-overlay"], [class*="modal"][id]').forEach(modal => {
      const overlay = modal.classList.contains('modal-overlay') || 
                     modal.id.includes('Overlay') ? modal : null;
      
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this.close(overlay);
          }
        });
      }
      
      // Fermer au clic sur le bouton close
      const closeBtn = modal.querySelector('[class*="close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.close(modal);
        });
      }
    });
  },

  /**
   * Fermer au clic sur Echap
   */
  setupEscapeKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openModals.length > 0) {
        this.close(this.openModals[this.openModals.length - 1]);
      }
    });
  }
};

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  ModalManager.setupOverlayClosing();
  ModalManager.setupEscapeKey();
});

// Re-initialiser après chaque chargement de vue (pour app.js)
if (typeof APP !== 'undefined') {
  const originalExecuteViewScripts = APP.executeViewScripts;
  APP.executeViewScripts = function(view) {
    originalExecuteViewScripts.call(this, view);
    // Re-setup après chargement de la vue
    setTimeout(() => {
      ModalManager.closeAll();
      ModalManager.setupOverlayClosing();
    }, 100);
  };
}
