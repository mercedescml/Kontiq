/**
 * Performance Optimizer - Optimise les performances et le cache
 * Ajoute des en-têtes de cache côté serveur et client
 */

// Service Worker pour le cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}

// LocalStorage Cache pour les données
const CacheManager = {
  // Clés du cache
  CACHE_KEYS: {
    USER: 'kontiq_user',
    COMPANY: 'kontiq_company',
    VIEWS: 'kontiq_views'
  },

  /**
   * Obtenir une valeur du cache
   */
  get(key, maxAge = 3600000) { // Par défaut 1 heure
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const data = JSON.parse(item);
      const now = Date.now();
      
      if (data.timestamp && (now - data.timestamp) > maxAge) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data.value;
    } catch (e) {
      return item; // Retourner comme string si parsing échoue
    }
  },

  /**
   * Sauvegarder une valeur dans le cache
   */
  set(key, value, ttl = 3600000) {
    try {
      const data = {
        value: value,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Cache set failed:', e);
    }
  },

  /**
   * Effacer le cache
   */
  clear(key) {
    localStorage.removeItem(key);
  },

  /**
   * Effacer tout le cache
   */
  clearAll() {
    Object.values(this.CACHE_KEYS).forEach(key => {
      this.clear(key);
    });
  }
};

// Optimiser les images - lazy loading
document.addEventListener('DOMContentLoaded', () => {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img:not([loading="eager"])');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.style.opacity = '1';
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => {
      img.loading = 'lazy';
      imageObserver.observe(img);
    });
  }
});

// Debouncer pour les fonctions coûteuses
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle pour les événements fréquents
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Optimiser les appels API
const apiCallCache = new Map();

async function cachedFetch(url, options = {}, cacheTime = 5000) {
  const cacheKey = url + JSON.stringify(options);
  
  // Vérifier le cache
  if (apiCallCache.has(cacheKey)) {
    const cached = apiCallCache.get(cacheKey);
    if (Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Sauvegarder dans le cache
    apiCallCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    // Nettoyer le cache après le temps d'expiration
    setTimeout(() => {
      apiCallCache.delete(cacheKey);
    }, cacheTime);
    
    return data;
  } catch (error) {
    console.error('Cached fetch failed:', error);
    throw error;
  }
}

// Prefix pour les requêtes
window.cachedFetch = cachedFetch;
window.CacheManager = CacheManager;
window.debounce = debounce;
window.throttle = throttle;
