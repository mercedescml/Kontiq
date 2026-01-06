# Kontiq - Finanz-Autopilot

Application de gestion financière pour PME suisses.

## 🚀 Démarrage rapide

```bash
# Installation
npm install

# Lancement
node server.js
```

Le serveur démarre sur `http://localhost:3000`

## 📁 Structure du projet

```
Kontiq/
├── server.js           # Serveur Express principal
├── package.json        # Dépendances Node.js
├── data/               # Données JSON (persistence)
├── public/             # Frontend
│   ├── index.html      # Application principale
│   ├── landing.html    # Page d'accueil
│   ├── onboarding.html # Processus d'inscription
│   ├── auth/           # Pages d'authentification
│   ├── css/            # Styles
│   ├── js/             # Scripts JavaScript
│   └── views/          # Vues de l'application
└── docs/               # Documentation technique
```

## 🔧 API Endpoints

### Authentification
- `POST /api/users/register` - Inscription
- `POST /api/users/login` - Connexion

### Données
- `GET/POST/PUT/DELETE /api/contracts` - Contrats
- `GET/POST/PUT/DELETE /api/zahlungen` - Paiements
- `GET/POST/PUT/DELETE /api/kosten` - Coûts
- `GET/POST/PUT/DELETE /api/forderungen` - Créances
- `GET/POST/PUT/DELETE /api/bankkonten` - Comptes bancaires
- `GET/POST/PUT/DELETE /api/entitaeten` - Entités

### Permissions
- `GET /api/permissions/user/:email` - Permissions utilisateur
- `POST /api/permissions/global` - Permissions globales
- `POST /api/permissions/entity` - Permissions par entité

## 🔐 Système de permissions

- **Geschäftsführer** : Accès complet à tout
- **Manager** : Accès aux entités gérées
- **Employee** : Accès limité selon permissions

## 📋 Modules

| Module | Description |
|--------|-------------|
| Dashboard | Vue d'ensemble KPIs |
| Zahlungen | Gestion des paiements |
| Forderungen | Gestion des créances |
| Kosten | Suivi des coûts |
| Liquidität | Analyse liquidité |
| Verträge | Gestion contrats |
| Bankkonten | Comptes bancaires |
| Entitäten | Gestion des entités |
| Reports | Rapports et exports |

## 🛠 Technologies

- **Backend** : Node.js, Express
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Stockage** : Fichiers JSON
- **Charts** : Chart.js

## 📝 Licence

Propriétaire - Kontiq AG
