/**
 * API Client - Gestion centralisée des appels API
 */

const API = {
  BASE_URL: '/api',

  /**
   * Requête générique
   */
  async request(endpoint, method = 'GET', data = null, withUser = false) {
    // Ajoute automatiquement userId (email) si demandé
    let userId = null;
    try {
      const user = JSON.parse(localStorage.getItem('kontiq_user') || '{}');
      userId = user && user.email ? user.email : null;
    } catch {}

    // Ajoute userId dans le body pour POST/PUT
    if (withUser && (method === 'POST' || method === 'PUT')) {
      data = { ...(data || {}), userId };
    }

    // Ajoute userId dans la query pour GET
    if (withUser && method === 'GET' && userId && !endpoint.includes('userId=')) {
      endpoint += (endpoint.includes('?') ? '&' : '?') + 'userId=' + encodeURIComponent(userId);
    }

    const config = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) config.body = JSON.stringify(data);

    const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Catégories
  categories: {
    getAll: () => API.request('/categories'),
    add: (name) => API.request('/categories', 'POST', { name }),
    delete: (name) => API.request(`/categories/${name}`, 'DELETE')
  },

  // Utilisateurs
  users: {
    register: (email, password, name, company) => 
      API.request('/users/register', 'POST', { email, password, name, company }),
    login: (email, password) => 
      API.request('/users/login', 'POST', { email, password })
  },

  // Onboarding
  onboarding: {
    get: (email) => API.request(`/onboarding?email=${email}`),
    save: (email, data) => API.request('/onboarding', 'POST', { email, data })
  },

  // Dashboard
  dashboard: {
    getData: () => API.request('/dashboard')
  },

  // Zahlungen (Paiements)
  zahlungen: {
    getAll: () => API.request('/zahlungen', 'GET', null, true),
    create: (data) => API.request('/zahlungen', 'POST', data, true),
    update: (id, data) => API.request(`/zahlungen/${id}`, 'PUT', data, true),
    delete: (id) => API.request(`/zahlungen/${id}`, 'DELETE')
  },

  // Contracts (Verträge)
  contracts: {
    getAll: () => API.request('/contracts', 'GET', null, true),
    create: (data) => API.request('/contracts', 'POST', data, true),
    update: (id, data) => API.request(`/contracts/${id}`, 'PUT', data, true),
    delete: (id) => API.request(`/contracts/${id}`, 'DELETE')
  },

  // Bankkonten
  bankkonten: {
    getAll: () => API.request('/bankkonten', 'GET', null, true),
    create: (data) => API.request('/bankkonten', 'POST', data, true),
    update: (id, data) => API.request(`/bankkonten/${id}`, 'PUT', data, true),
    delete: (id) => API.request(`/bankkonten/${id}`, 'DELETE')
  },

  // Kosten
  kosten: {
    getAll: () => API.request('/kosten', 'GET', null, true),
    create: (data) => API.request('/kosten', 'POST', data, true),
    update: (id, data) => API.request(`/kosten/${id}`, 'PUT', data, true),
    delete: (id) => API.request(`/kosten/${id}`, 'DELETE')
  },

  // Forderungen
  forderungen: {
    getAll: () => API.request('/forderungen', 'GET', null, true),
    create: (data) => API.request('/forderungen', 'POST', data, true),
    update: (id, data) => API.request(`/forderungen/${id}`, 'PUT', data, true),
    delete: (id) => API.request(`/forderungen/${id}`, 'DELETE')
  },

  // Entitäten
  entitaeten: {
    getAll: () => API.request('/entitaeten'),
    create: (data) => API.request('/entitaeten', 'POST', data),
    update: (id, data) => API.request(`/entitaeten/${id}`, 'PUT', data),
    delete: (id) => API.request(`/entitaeten/${id}`, 'DELETE')
  },

  // KPIs
  kpis: {
    getAll: () => API.request('/kpis')
  },

  // Reports
  reports: {
    generate: (filters) => API.request('/reports', 'POST', filters),
    export: (format = 'pdf') => API.request(`/reports/export?format=${format}`)
  },

  // Export
  export: {
    toPdf: (data) => API.request('/export/pdf', 'POST', data),
    toExcel: (data) => API.request('/export/excel', 'POST', data)
  },

  // Abonnement
  abonnement: {
    getStatus: () => API.request('/abonnement'),
    update: (data) => API.request('/abonnement', 'PUT', data)
  },

  // Einstellungen
  einstellungen: {
    get: () => API.request('/einstellungen'),
    update: (data) => API.request('/einstellungen', 'PUT', data)
  },

  // Bookings
  bookings: {
    getAll: () => API.request('/bookings'),
    create: (data) => API.request('/bookings', 'POST', data)
  }
};
