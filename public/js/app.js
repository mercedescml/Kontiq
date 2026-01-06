/**
 * App.js - Gestion globale de l'application
 * Navigation, session, et contrôles globaux
 * ULTRA-OPTIMISÉ pour performance instantanée
 */

const APP = {
  currentUser: null,
  currentView: 'dashboard',
  
  // Cache pour les vues HTML et les données
  viewCache: new Map(),
  dataCache: new Map(),
  scriptLoaded: new Set(),
  pendingFetches: new Map(),
  
  // Pré-chargement des vues les plus utilisées
  priorityViews: ['dashboard', 'zahlungen', 'forderungen', 'kosten', 'liquiditat', 'vertrage', 'kpis', 'reports', 'bankkonten', 'entitaeten', 'einstellungen'],

  /**
   * Initialisation de l'app au chargement
   */
  init() {
    console.log('Initializing Kontiq app (ultra-optimized)...');
    this.loadUser();
    this.setupNavigation();
    // Préchargement parallèle immédiat
    this.preloadAllNow();
  },

  /**
   * Pré-charge TOUT immédiatement en parallèle
   */
  preloadAllNow() {
    // Charger toutes les vues en parallèle immédiatement
    const viewPromises = this.priorityViews.map(view => {
      if (!this.viewCache.has(view)) {
        const fetchPromise = fetch(`/views/${view}.html`)
          .then(r => r.ok ? r.text() : null)
          .then(html => {
            if (html) {
              this.viewCache.set(view, html);
              console.log(`✓ Cached: ${view}`);
            }
          })
          .catch(() => {});
        this.pendingFetches.set(view, fetchPromise);
        return fetchPromise;
      }
      return Promise.resolve();
    });

    // Précharger tous les scripts en parallèle
    this.priorityViews.forEach(view => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = `/js/${view}.js`;
      document.head.appendChild(link);
    });

    // Log quand tout est prêt
    Promise.all(viewPromises).then(() => {
      console.log('✓ All views preloaded');
      this.pendingFetches.clear();
    });
  },

  /**
   * Charge l'utilisateur depuis localStorage
   */
  loadUser() {
    const userJson = localStorage.getItem('kontiq_user');
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
        console.log('User loaded:', this.currentUser.email);
      } catch (e) {
        console.error('Failed to parse user', e);
        this.logout();
      }
    }
  },

  /**
   * Sauvegarde l'utilisateur
   */
  saveUser(user) {
    const prev = this.currentUser || (() => {
      try { return JSON.parse(localStorage.getItem('kontiq_user') || '{}'); } catch (e) { return {}; }
    })();
    if (prev && prev.email && prev.email !== user.email) {
      this.clearUserData();
    }
    this.currentUser = user;
    localStorage.setItem('kontiq_user', JSON.stringify(user));
  },

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    this.currentUser = null;
    this.clearUserData();
    localStorage.removeItem('kontiq_user');
    window.location.href = '/auth/login.html';
  },

  /**
   * Purge les données locales liées à un utilisateur
   */
  clearUserData() {
    localStorage.removeItem('kontiq_onboarding_progress');
    localStorage.removeItem('kontiq_company');
    localStorage.removeItem('kontiq_onboarding_complete');
  },

  /**
   * Configure la navigation entre les pages
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-view]');
    navLinks.forEach(link => {
      // Pré-charger au survol
      link.addEventListener('mouseenter', () => {
        const view = link.getAttribute('data-view');
        this.preloadSingleView(view);
      });
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.navigateTo(view);
      });
    });
  },

  /**
   * Pré-charge une seule vue
   */
  preloadSingleView(view) {
    if (!this.viewCache.has(view)) {
      fetch(`/views/${view}.html`)
        .then(r => r.ok ? r.text() : null)
        .then(html => {
          if (html) this.viewCache.set(view, html);
        })
        .catch(() => {});
    }
  },

  /**
   * Navigue vers une page/vue - ULTRA RAPIDE avec animations
   */
  async navigateTo(view) {
    console.log('Navigating to:', view);
    
    const container = document.getElementById('main-content') || 
                     document.getElementById('content') ||
                     document.querySelector('main');
    
    if (!container) {
      console.error('No main content container found');
      return;
    }

    // Fermer les modales immédiatement
    if (typeof ModalManager !== 'undefined') {
      ModalManager.closeAll();
    }

    // Si la vue est en cache, l'afficher IMMÉDIATEMENT
    if (this.viewCache.has(view)) {
      this.renderView(container, view, this.viewCache.get(view));
      return;
    }

    // Si un fetch est en cours pour cette vue, attendre
    if (this.pendingFetches.has(view)) {
      await this.pendingFetches.get(view);
      if (this.viewCache.has(view)) {
        this.renderView(container, view, this.viewCache.get(view));
        return;
      }
    }

    // Sinon, charger avec indicateur minimal (transition rapide)
    container.style.opacity = '0.5';
    container.style.transition = 'opacity 0.1s';
    
    try {
      const response = await fetch(`/views/${view}.html`);
      if (!response.ok) throw new Error(`Failed to load ${view}`);
      const html = await response.text();
      this.viewCache.set(view, html);
      this.renderView(container, view, html);
    } catch (err) {
      console.error('Navigation error:', err);
      container.innerHTML = `<p style="color: red; padding: 20px;">Erreur lors du chargement. Veuillez réessayer.</p>`;
      container.style.opacity = '1';
    }
  },

  /**
   * Render la vue et exécute les scripts - OPTIMISÉ
   */
  renderView(container, view, html) {
    this.currentView = view;
    
    // Injecter le HTML immédiatement
    container.innerHTML = html;
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';
    
    // Exécuter les scripts inline avec requestAnimationFrame pour ne pas bloquer
    requestAnimationFrame(() => {
      this.executeInlineScripts(container);
    });
    
    // Charger le script externe de la vue
    this.loadViewScript(view);
    
    // Appeler l'initialisation spécifique à la vue
    requestAnimationFrame(() => this.initializeView(view));
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Mettre à jour la nav active
    this.updateActiveNav(view);
  },

  /**
   * Exécute les scripts inline dans le container
   */
  executeInlineScripts(container) {
    const scripts = container.querySelectorAll('script');
    console.log(`Executing ${scripts.length} inline scripts...`);
    
    scripts.forEach((oldScript, index) => {
      const newScript = document.createElement('script');
      
      // Copier tous les attributs
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        // Pour les scripts inline, utiliser textContent
        newScript.textContent = oldScript.textContent;
      }
      
      // Supprimer l'ancien et ajouter le nouveau au document
      oldScript.remove();
      document.body.appendChild(newScript);
      console.log(`Script ${index + 1} executed`);
    });
  },

  /**
   * Initialise la vue après le rendu
   */
  initializeView(view, retryCount = 0) {
    console.log(`Initializing view: ${view} (attempt ${retryCount + 1})`);
    
    // Appeler les fonctions d'initialisation globales définies par les scripts inline
    const initFunctions = {
      'vertrage': 'loadContracts',
      'zahlungen': 'loadZahlungen',
      'kosten': 'loadKosten',
      'forderungen': 'loadForderungen',
      'bankkonten': 'loadBankkonten',
      'entitaeten': 'loadEntitaeten',
      'dashboard': 'loadDashboard'
    };
    
    const fnName = initFunctions[view];
    if (fnName) {
      if (typeof window[fnName] === 'function') {
        console.log(`Calling ${fnName}()`);
        window[fnName]();
      } else if (retryCount < 10) {
        // Réessayer si la fonction n'est pas encore disponible
        setTimeout(() => this.initializeView(view, retryCount + 1), 50);
      }
    }
  },

  /**
   * Charge et exécute le script JS de la vue
   */
  loadViewScript(view) {
    const initFnName = `${view}Init`;
    
    // Si le script est déjà chargé, exécuter l'init
    if (this.scriptLoaded.has(view)) {
      if (typeof window[initFnName] === 'function') {
        setTimeout(() => window[initFnName](), 0);
      }
      return;
    }
    
    const script = document.createElement('script');
    script.src = `/js/${view}.js`;
    script.onload = () => {
      this.scriptLoaded.add(view);
      if (typeof window[initFnName] === 'function') {
        window[initFnName]();
      }
    };
    script.onerror = () => console.warn(`Script /js/${view}.js not found`);
    document.head.appendChild(script);
  },

  /**
   * Met à jour la navigation active
   */
  updateActiveNav(view) {
    document.querySelectorAll('[data-view]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === view);
    });
  },

  /**
   * Affiche une notification toast
   */
  notify(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = {
      'success': '#10B981',
      'error': '#EF4444',
      'warning': '#F59E0B',
      'info': '#3B82F6'
    }[type] || '#3B82F6';

    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Affiche une modal de confirmation
   */
  confirm(message) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 20px 25px rgba(0,0,0,0.15);
        max-width: 400px;
      `;
      content.innerHTML = `
        <p style="margin-bottom: 20px; color: #111827;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn btn-secondary" id="confirm-no">Annuler</button>
          <button class="btn btn-primary" id="confirm-yes">Confirmer</button>
        </div>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      document.getElementById('confirm-yes').addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });
      document.getElementById('confirm-no').addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });
    });
  }
};

// Initialiser l'app au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});
