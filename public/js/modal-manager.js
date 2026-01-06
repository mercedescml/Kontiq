/**
 * Modal Manager - Gestion unifiée des modales
 * OPTIMISÉ pour ouverture/fermeture instantanée
 */

const ModalManager = {
  openModals: [],
  modalCache: new WeakMap(),

  open(selector) {
    const modal = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!modal) return;
    
    // Utiliser classList pour les transitions CSS
    modal.classList.add('active');
    modal.style.display = 'flex';
    this.openModals.push(modal);
    document.body.style.overflow = 'hidden';
    
    // Focus sur le premier input immédiatement
    requestAnimationFrame(() => {
      const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
      if (firstInput) firstInput.focus();
    });
  },

  close(selector) {
    const modal = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!modal) return;
    
    modal.classList.remove('active');
    // Attendre la fin de la transition avant de cacher
    setTimeout(() => {
      if (!modal.classList.contains('active')) {
        modal.style.display = 'none';
      }
    }, 150);
    
    this.openModals = this.openModals.filter(m => m !== modal);
    
    if (this.openModals.length === 0) {
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    this.openModals.forEach(modal => {
      modal.classList.remove('active');
      modal.style.display = 'none';
    });
    this.openModals = [];
    document.body.style.overflow = '';
  },

  init() {
    // Utiliser event delegation pour de meilleures performances
    document.addEventListener('click', (e) => {
      // Fermeture au clic sur overlay
      const modal = e.target.closest('[class*="modal"], [id*="modal"], [id*="Modal"]');
      if (modal && e.target === modal) {
        this.close(modal);
        return;
      }
      
      // Boutons close
      const closeBtn = e.target.closest('[class*="close"], [onclick*="close"]');
      if (closeBtn) {
        const parentModal = closeBtn.closest('[class*="modal"], [id*="modal"], [id*="Modal"]');
        if (parentModal) {
          e.preventDefault();
          e.stopPropagation();
          this.close(parentModal);
        }
      }
    });

    // Fermeture avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openModals.length > 0) {
        this.close(this.openModals[this.openModals.length - 1]);
      }
    });
  }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => ModalManager.init());
