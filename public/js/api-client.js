/**
 * API Client centralisé
 * Gère tous les appels API
 */

const API = {
  BASE_URL: '/api',

  /**
   * Fonction générique de fetch
   */
  async request(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  },

  // ========== CATEGORIES ==========
  categories: {
    async getAll() {
      return API.request('/categories');
    },
    async add(name) {
      return API.request('/categories', 'POST', { name });
    },
    async delete(name) {
      return API.request(`/categories/${name}`, 'DELETE');
    }
  },

  // ========== USERS ==========
  users: {
    async register(email, password, name, company) {
      return API.request('/users/register', 'POST', {
        email, password, name, company
      });
    },
    async login(email, password) {
      return API.request('/users/login', 'POST', { email, password });
    }
  },

  // ========== ONBOARDING ==========
  onboarding: {
    async get(email) {
      return API.request(`/onboarding?email=${email}`);
    },
    async save(email, data) {
      return API.request('/onboarding', 'POST', { email, data });
    }
  },

  // ========== DASHBOARD ==========
  dashboard: {
    async getData() {
      return API.request('/dashboard');
    }
  },

  // ========== ZAHLUNGEN (PAIEMENTS) ==========
  zahlungen: {
    async getAll() {
      return API.request('/zahlungen');
    },
    async create(data) {
      return API.request('/zahlungen', 'POST', data);
    },
    async update(id, data) {
      return API.request(`/zahlungen/${id}`, 'PUT', data);
    },
    async delete(id) {
      return API.request(`/zahlungen/${id}`, 'DELETE');
    }
  },

  // ========== CONTRACTS (VERTRÄGE) ==========
  contracts: {
    async getAll() {
      return API.request('/contracts');
    },
    async create(data) {
      return API.request('/contracts', 'POST', data);
    },
    async update(id, data) {
      return API.request(`/contracts/${id}`, 'PUT', data);
    },
    async delete(id) {
      return API.request(`/contracts/${id}`, 'DELETE');
    },
    async upload(formData) {
      // Spécial: envoyer FormData sans JSON header
      const response = await fetch(`${this.BASE_URL}/contracts/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    }
  },

  // ========== BANKKONTEN (COMPTES BANCAIRES) ==========
  bankkonten: {
    async getAll() {
      return API.request('/bankkonten');
    },
    async create(data) {
      return API.request('/bankkonten', 'POST', data);
    },
    async update(id, data) {
      return API.request(`/bankkonten/${id}`, 'PUT', data);
    },
    async delete(id) {
      return API.request(`/bankkonten/${id}`, 'DELETE');
    }
  },

  // ========== KOSTEN (COÛTS) ==========
  kosten: {
    async getAll() {
      return API.request('/kosten');
    },
    async create(data) {
      return API.request('/kosten', 'POST', data);
    },
    async update(id, data) {
      return API.request(`/kosten/${id}`, 'PUT', data);
    },
    async delete(id) {
      return API.request(`/kosten/${id}`, 'DELETE');
    }
  },

  // ========== FORDERUNGEN (CRÉANCES) ==========
  forderungen: {
    async getAll() {
      return API.request('/forderungen');
    },
    async create(data) {
      return API.request('/forderungen', 'POST', data);
    },
    async update(id, data) {
      return API.request(`/forderungen/${id}`, 'PUT', data);
    },
    async delete(id) {
      return API.request(`/forderungen/${id}`, 'DELETE');
    }
  },

  // ========== KPIs ==========
  kpis: {
    async getAll() {
      return API.request('/kpis');
    }
  },

  // ========== REPORTS (RAPPORTS) ==========
  reports: {
    async generate(filters) {
      return API.request('/reports', 'POST', filters);
    },
    async export(format = 'pdf') {
      return API.request(`/reports/export?format=${format}`);
    }
  },

  // ========== EXPORT ==========
  export: {
    async toPdf(data) {
      return API.request('/export/pdf', 'POST', data);
    },
    async toExcel(data) {
      return API.request('/export/excel', 'POST', data);
    }
  },

  // ========== CREDIT SIMULATOR ==========
  simulator: {
    async calculateCredit(amount, interest, term) {
      return API.request('/credit-simulator', 'POST', {
        amount, interest, term
      });
    }
  },

  // ========== ENTITÄTEN (ENTITÉS) ==========
  entitaeten: {
    async getAll() {
      return API.request('/entitaeten');
    },
    async create(data) {
      return API.request('/entitaeten', 'POST', data);
    },
    async update(id, data) {
      return API.request(`/entitaeten/${id}`, 'PUT', data);
    },
    async delete(id) {
      return API.request(`/entitaeten/${id}`, 'DELETE');
    }
  },

  // ========== ABONNEMENT ==========
  abonnement: {
    async getStatus() {
      return API.request('/abonnement');
    },
    async update(data) {
      return API.request('/abonnement', 'PUT', data);
    }
  },

  // ========== EINSTELLUNGEN (PARAMÈTRES) ==========
  einstellungen: {
    async get() {
      return API.request('/einstellungen');
    },
    async update(data) {
      return API.request('/einstellungen', 'PUT', data);
    }
  },

  // ========== BOOKINGS (RÉSERVATIONS DE DÉMO) ==========
  bookings: {
    async getAll() {
      return API.request('/bookings');
    },
    async create(data) {
      return API.request('/bookings', 'POST', data);
    }
  }
};
