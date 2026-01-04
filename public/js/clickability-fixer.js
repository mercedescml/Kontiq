/**
 * Clickability Fixer - Résout les problèmes de clics non réactifs
 * Ajoute des délais et des états appropriés
 */

function fixClickability() {
  // Fixer les boutons avec des pointer-events manquants
  document.querySelectorAll('button, [role="button"], [class*="btn"]').forEach(btn => {
    if (btn.style.pointerEvents === 'none') {
      btn.style.pointerEvents = 'auto';
    }
  });

  // Ajouter des visual feedback pour les boutons
  document.querySelectorAll('button:not(.no-feedback), [class*="btn"]:not(.no-feedback)').forEach(btn => {
    if (btn.tagName !== 'BUTTON' && !btn.classList.contains('btn')) {
      return;
    }

    // Ajouter feedback visuel au clic
    btn.addEventListener('mousedown', function() {
      this.style.opacity = '0.8';
      this.style.transform = 'scale(0.98)';
    });

    btn.addEventListener('mouseup', function() {
      this.style.opacity = '1';
      this.style.transform = 'scale(1)';
    });

    btn.addEventListener('mouseleave', function() {
      this.style.opacity = '1';
      this.style.transform = 'scale(1)';
    });
  });

  // Vérifier que les modales ont les bons event listeners
  document.querySelectorAll('[id*="modal"], [id*="Modal"]').forEach(modal => {
    if (modal.classList.contains('modal') || modal.classList.contains('modal-overlay')) {
      // Ajouter un listener d'échappement s'il n'existe pas
      if (!modal.hasAttribute('data-esc-listener')) {
        modal.setAttribute('data-esc-listener', 'true');
        
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            if (typeof ModalManager !== 'undefined') {
              ModalManager.close(modal);
            } else {
              modal.classList.remove('active');
              modal.style.display = 'none';
            }
          }
        });
      }
    }
  });

  // Désactiver les transitions sur les éléments masqués
  document.querySelectorAll('[style*="display: none"]').forEach(el => {
    el.style.pointerEvents = 'none';
  });

  // Re-activer quand visible
  document.querySelectorAll('[style*="display: block"]').forEach(el => {
    el.style.pointerEvents = 'auto';
  });
}

// Exécuter au chargement
document.addEventListener('DOMContentLoaded', () => {
  fixClickability();
  
  // Ré-exécuter toutes les 500ms pour s'assurer que les nouveaux éléments sont traités
  setInterval(fixClickability, 500);
});

// Ré-exécuter après chaque navigation
if (typeof APP !== 'undefined') {
  const originalExecuteViewScripts = APP.executeViewScripts;
  APP.executeViewScripts = function(view) {
    originalExecuteViewScripts.call(this, view);
    setTimeout(fixClickability, 100);
  };
}

// Empêcher les doubles-clics accidentels
const clickedElements = new Set();
document.addEventListener('click', (e) => {
  const target = e.target;
  
  // Si c'est un bouton ou un lien
  if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.classList.contains('btn')) {
    // Vérifier si on vient de cliquer dessus
    if (clickedElements.has(target)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Ajouter à la liste des éléments cliqués
    clickedElements.add(target);
    
    // Retirer après 300ms
    setTimeout(() => {
      clickedElements.delete(target);
    }, 300);
  }
}, true);
