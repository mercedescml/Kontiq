/**
 * Form Harmonizer - Standardise les formulaires à travers l'app
 * Applique les styles cohérents et améliore l'expérience utilisateur
 */

function harmonizeForms() {
  // Harmoniser tous les inputs
  document.querySelectorAll('input, textarea, select').forEach(el => {
    // Ajouter les classes appropriées s'ils n'en ont pas
    if (!el.className) {
      if (el.tagName === 'SELECT') {
        el.classList.add('form-select');
      } else if (el.tagName === 'TEXTAREA') {
        el.classList.add('form-input');
      } else {
        el.classList.add('form-input');
      }
    }
  });

  // Harmoniser les labels associés
  document.querySelectorAll('label').forEach(label => {
    if (!label.className) {
      label.classList.add('form-label');
    }
  });

  // Standardiser la taille des inputs dans les forms
  document.querySelectorAll('.form-group, [class*="form-group"]').forEach(group => {
    const input = group.querySelector('input, textarea, select');
    if (input && !input.className) {
      if (input.tagName === 'SELECT') {
        input.classList.add('form-select');
      } else if (input.tagName === 'TEXTAREA') {
        input.classList.add('form-input');
      } else {
        input.classList.add('form-input');
      }
    }
  });

  // Fixer les tailles inconsistantes des champs de saisie
  const inputs = document.querySelectorAll(
    'input[class*="form"], input[class*="input"], ' +
    'textarea[class*="form"], textarea[class*="input"], ' +
    'select[class*="form"], select[class*="select"]'
  );

  inputs.forEach(input => {
    // Assurer padding cohérent
    if (!input.style.padding || input.style.padding === '') {
      input.style.padding = '12px 16px';
    }
    
    // Assurer hauteur minimale pour les inputs
    if (input.tagName !== 'TEXTAREA' && (!input.style.height || input.style.height === '')) {
      input.style.minHeight = '44px';
    }
  });

  // Harmoniser les boutons dans les forms
  document.querySelectorAll('form button, form [class*="btn"]').forEach(btn => {
    // Vérifier si c'est un vrai bouton
    if (btn.tagName !== 'BUTTON' && !btn.classList.contains('btn')) {
      return;
    }
    
    // Ajouter classe de base si manquante
    if (!btn.className.includes('btn')) {
      if (btn.className.includes('secondary') || btn.textContent.includes('Abbrechen') || btn.textContent.includes('Annuler')) {
        btn.classList.add('btn-secondary');
      } else if (btn.className.includes('danger') || btn.textContent.includes('Löschen') || btn.textContent.includes('Supprimer')) {
        btn.classList.add('btn-danger');
      } else {
        btn.classList.add('btn-primary');
      }
    }
    
    // Assurer le padding
    if (!btn.style.padding || btn.style.padding === '') {
      btn.style.padding = '12px 24px';
    }
  });
  
  // Harmoniser tous les modals - S'assurer qu'ils ont tous un bouton de fermeture
  harmonizeModals();
}

function harmonizeModals() {
  document.querySelectorAll('.modal, [class*="modal"]').forEach(modal => {
    const modalHeader = modal.querySelector('.modal-header, [class*="modal-header"]');
    if (!modalHeader) return;
    
    // Vérifier si le modal a déjà un bouton de fermeture
    const hasCloseButton = modalHeader.querySelector(
      '.close-modal, .modal-close, [class*="modal-close"]'
    );
    
    if (hasCloseButton) {
      // S'assurer que le bouton est bien positionné
      ensureCloseButtonStyle(hasCloseButton);
    }
    
    // S'assurer que le header a le bon layout
    if (!modalHeader.style.display || modalHeader.style.display === '') {
      modalHeader.style.display = 'flex';
      modalHeader.style.alignItems = 'flex-start';
      modalHeader.style.justifyContent = 'space-between';
      modalHeader.style.gap = '16px';
    }
  });
}

function ensureCloseButtonStyle(button) {
  // Appliquer un style cohérent au bouton de fermeture
  if (!button.style.fontSize) {
    button.style.fontSize = '24px';
  }
  if (!button.style.width) {
    button.style.width = '36px';
    button.style.height = '36px';
  }
  if (!button.style.display || button.style.display === '') {
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
  }
}

// Exécuter quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  // Petit délai pour s'assurer que tout est chargé
  setTimeout(harmonizeForms, 100);
});

// Ré-exécuter après chaque navigation
if (typeof APP !== 'undefined') {
  const originalExecuteViewScripts = APP.executeViewScripts;
  APP.executeViewScripts = function(view) {
    originalExecuteViewScripts.call(this, view);
    setTimeout(harmonizeForms, 150);
  };
}

// Observer pour détecter les changements DOM
const observer = new MutationObserver(() => {
  harmonizeForms();
});

document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
});
