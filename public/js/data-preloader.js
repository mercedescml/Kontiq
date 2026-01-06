/**
 * Data Preloader - Pré-charge et cache les données API
 * ULTRA-OPTIMISÉ pour affichage instantané
 */

const DataPreloader = {
  cache: new Map(),
  cacheExpiry: new Map(),
  pendingRequests: new Map(),
  CACHE_DURATION: 120000, // 2 minutes
  initialized: false,

  /**
   * Initialise le pré-chargement immédiatement
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Charger immédiatement
    this.preloadAllData();
    
    // Rafraîchir périodiquement en arrière-plan
    setInterval(() => this.preloadAllData(), this.CACHE_DURATION);
  },

  /**
   * Pré-charge toutes les données principales en parallèle
   */
  async preloadAllData() {
    const endpoints = [
      { key: 'zahlungen', url: '/api/zahlungen' },
      { key: 'forderungen', url: '/api/forderungen' },
      { key: 'kosten', url: '/api/kosten' },
      { key: 'contracts', url: '/api/contracts' },
      { key: 'bankkonten', url: '/api/bankkonten' },
      { key: 'dashboard', url: '/api/dashboard' },
      { key: 'entitaeten', url: '/api/entitaeten' },
      { key: 'kpis', url: '/api/kpis' }
    ];

    // Charger en parallèle avec Promise.all pour max de vitesse
    const results = await Promise.allSettled(
      endpoints.map(ep => this.fetchAndCache(ep.key, ep.url))
    );
    
    const loaded = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✓ Data preloaded: ${loaded}/${endpoints.length}`);
  },

  /**
   * Fetch et met en cache - avec déduplication des requêtes
   */
  async fetchAndCache(key, url) {
    // Si une requête est déjà en cours, la réutiliser
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const fetchPromise = (async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          this.cache.set(key, data);
          this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
          return data;
        }
      } catch (e) {
        console.warn(`Preload ${key} failed:`, e.message);
      } finally {
        this.pendingRequests.delete(key);
      }
      return null;
    })();
    
    this.pendingRequests.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * Récupère les données du cache ou fetch si nécessaire
   * OPTIMISÉ: retourne le cache immédiatement et rafraîchit en arrière-plan
   */
  async get(key, url, forceRefresh = false) {
    const now = Date.now();
    const hasCache = this.cache.has(key);
    const isExpired = !this.cacheExpiry.has(key) || this.cacheExpiry.get(key) < now;
    
    // Si cache valide et pas de force refresh, retourner immédiatement
    if (hasCache && !isExpired && !forceRefresh) {
      return this.cache.get(key);
    }
    
    // Si cache existe mais expiré, le retourner ET rafraîchir en arrière-plan
    if (hasCache && isExpired && !forceRefresh) {
      // Rafraîchir en arrière-plan
      this.fetchAndCache(key, url);
      // Retourner le cache périmé immédiatement
      return this.cache.get(key);
    }
    
    // Pas de cache, fetch et retourner
    return await this.fetchAndCache(key, url);
  },

  /**
   * Récupère les données du cache synchrone (pour affichage instantané)
   */
  getSync(key) {
    return this.cache.get(key) || null;
  },

  /**
   * Vérifie si les données sont en cache
   */
  has(key) {
    return this.cache.has(key);
  },

  /**
   * Invalide un cache spécifique (après une modification)
   */
  invalidate(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    this.pendingRequests.delete(key);
  },

  /**
   * Invalide tout le cache
   */
  invalidateAll() {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.pendingRequests.clear();
  }
};

// Initialiser immédiatement au chargement du script
DataPreloader.init();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
  DataPreloader.init();
});
