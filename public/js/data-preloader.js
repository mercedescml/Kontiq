/**
 * Data Preloader - Pré-charge et cache les données API
 * Pour un affichage instantané des données
 */

const DataPreloader = {
  cache: new Map(),
  cacheExpiry: new Map(),
  CACHE_DURATION: 60000, // 1 minute

  /**
   * Initialise le pré-chargement
   */
  init() {
    this.preloadAllData();
    // Rafraîchir le cache périodiquement
    setInterval(() => this.preloadAllData(), this.CACHE_DURATION);
  },

  /**
   * Pré-charge toutes les données principales
   */
  async preloadAllData() {
    const endpoints = [
      { key: 'zahlungen', url: '/api/zahlungen' },
      { key: 'forderungen', url: '/api/forderungen' },
      { key: 'kosten', url: '/api/kosten' },
      { key: 'contracts', url: '/api/contracts' },
      { key: 'bankkonten', url: '/api/bankkonten' },
      { key: 'dashboard', url: '/api/dashboard' },
      { key: 'entitaeten', url: '/api/entitaeten' }
    ];

    // Charger en parallèle
    await Promise.allSettled(
      endpoints.map(ep => this.fetchAndCache(ep.key, ep.url))
    );
    
    console.log('Data preloaded:', Array.from(this.cache.keys()));
  },

  /**
   * Fetch et met en cache
   */
  async fetchAndCache(key, url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        this.cache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
      }
    } catch (e) {
      console.warn(`Failed to preload ${key}:`, e);
    }
  },

  /**
   * Récupère les données du cache ou fetch si nécessaire
   */
  async get(key, url) {
    // Si en cache et pas expiré
    if (this.cache.has(key) && this.cacheExpiry.get(key) > Date.now()) {
      return this.cache.get(key);
    }

    // Sinon fetch
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        this.cache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
        return data;
      }
    } catch (e) {
      // Retourner le cache même expiré si fetch échoue
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      throw e;
    }
  },

  /**
   * Invalide un cache spécifique (après une modification)
   */
  invalidate(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  },

  /**
   * Invalide tout le cache
   */
  invalidateAll() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
  DataPreloader.init();
});
