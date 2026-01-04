/**
 * Close Button Fixer - Ajoute les boutons fermer manquants aux modales
 */

// Ajouter le CSS pour les boutons fermer s'il n'existe pas
function ensureCloseButtonCSS() {
  if (document.getElementById('close-button-fixer-css')) return;
  
  const style = document.createElement('style');
  style.id = 'close-button-fixer-css';
  style.textContent = `
    .close-modal {
      background: none !important;
      border: none !important;
      font-size: 24px !important;
      cursor: pointer !important;
      color: #6B7280 !important;
      padding: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
      border-radius: 6px !important;
      width: 36px !important;
      height: 36px !important;
      flex-shrink: 0 !important;
    }
    
    .close-modal:hover {
      background: #F3F4F6 !important;
      color: #0A2540 !important;
    }
  `;
  document.head.appendChild(style);
}

// Ajouter les boutons fermer à toutes les modales
function addCloseButtons() {
  // Sélecteurs pour tous les types de modales
  const modalSelectors = [
    '.modal',
    '[id*="modal"]',
    '[id*="Modal"]',
    '[class*="modal"]',
    '.bank-modal',
    '.entity-modal',
    '.kpi-modal'
  ];
  
  const modals = new Set();
  
  // Collecter tous les éléments modal uniques
  modalSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (el && el.nodeType === 1) modals.add(el);
      });
    } catch(e) {
      // Ignorer les sélecteurs invalides
    }
  });
  
  // Traiter chaque modale
  modals.forEach(modal => {
    // Chercher le header
    let header = modal.querySelector('[class*="modal-header"]') ||
                 modal.querySelector('.modal-header') ||
                 modal.querySelector('[class*="-modal-header"]') ||
                 modal.querySelector('.header');
    
    if (!header) return;
    
    // Vérifier s'il y a déjà une croix
    const existingClose = header.querySelector('button[class*="close"]') ||
                         header.querySelector('button[onclick*="close"]');
    
    if (existingClose) return; // Ne rien faire si la croix existe déjà
    
    // Créer le bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-modal';
    closeBtn.innerHTML = '×';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Fermer');
    
    // Ajouter le handler de fermeture
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Chercher la modale parente
      let parentModal = this.closest('[id*="modal"], [id*="Modal"], [class*="modal"]');
      
      if (!parentModal) return;
      
      // Essayer différentes méthodes de fermeture
      // 1. Trouver et cliquer le bouton "Abbrechen" ou "Schließen"
      const cancelBtn = parentModal.querySelector('[onclick*="close"]') ||
                       parentModal.querySelector('.btn-secondary') ||
                       parentModal.querySelector('[onclick*="Abbrechen"]');
      
      if (cancelBtn && cancelBtn.onclick) {
        try {
          cancelBtn.onclick();
          return;
        } catch(e) {
          console.error('Error clicking cancel button:', e);
        }
      }
      
      // 2. Utiliser ModalManager s'il existe
      if (typeof ModalManager !== 'undefined' && ModalManager.close) {
        try {
          ModalManager.close(parentModal);
          return;
        } catch(e) {
          console.error('Error using ModalManager:', e);
        }
      }
      
      // 3. Fermeture directe
      parentModal.classList.remove('active', 'show');
      parentModal.style.display = 'none';
      parentModal.style.visibility = 'hidden';
      
      // Déclencher un event de fermeture
      try {
        parentModal.dispatchEvent(new Event('closed'));
      } catch(e) {}
    });
    
    // Ajouter le bouton en fin du header (à droite)
    header.appendChild(closeBtn);
  });
}

// Exécution initiale
document.addEventListener('DOMContentLoaded', function() {
  ensureCloseButtonCSS();
  addCloseButtons();
});

// Ré-exécution après un délai pour les éléments dynamiques
setTimeout(function() {
  ensureCloseButtonCSS();
  addCloseButtons();
}, 500);

// Observer pour surveiller les changements du DOM
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(function() {
    clearTimeout(window.closeButtonFixerTimeout);
    window.closeButtonFixerTimeout = setTimeout(addCloseButtons, 200);
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
}

