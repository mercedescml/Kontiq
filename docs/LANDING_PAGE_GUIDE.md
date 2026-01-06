# 🎯 LANDING PAGE - Guide d'intégration

## ✅ Fichiers créés

### Pages HTML
- ✅ `public/landing.html` - Page d'accueil professionnelle

### Fichiers JavaScript
- ✅ `public/js/landing.js` - Gestion de la landing page
- ✅ `public/js/bookings.js` - Gestion des réservations (admin)

### Fichiers de données
- ✅ `data/bookings.json` - Réservations de démo

### Documentation API
- ✅ Routes API ajoutées dans `API_ROUTES_TO_ADD.js`

---

## 🚀 ÉTAPES D'INTÉGRATION

### Étape 1: Modifier le serveur

**Dans `server.js`, avant le dernier `app.get(/^\/(?!api).*/`:**

Ajouter les routes de bookings (de `API_ROUTES_TO_ADD.js`):
```javascript
// ========== DEMO BOOKINGS ==========
app.get('/api/bookings', (req, res) => {
  const bookings = readBookings();
  res.json({ bookings });
});

app.post('/api/bookings', (req, res) => {
  // ... (copier le code complet)
});
```

Ajouter les fonctions helper:
```javascript
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function readBookings() { ... }
function writeBookings(data) { ... }
```

### Étape 2: Définir la page d'accueil

**Dans `server.js`, modifier la route finale:**

```javascript
// Route de redirection pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Après tous les autres get, la route SPA
app.get(/^\/(?!api|landing|auth|views|js|public).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

### Étape 3: Tester

1. **Redémarrer le serveur:**
   ```bash
   npm start
   ```

2. **Accéder à la landing page:**
   ```
   http://localhost:3000/landing.html
   ```

3. **Tester le formulaire de réservation:**
   - Remplir le formulaire
   - Cliquer sur "Réserver votre démo"
   - Voir le modal de succès

4. **Vérifier les données:**
   - Vérifier que `data/bookings.json` contient la réservation

---

## 📋 CONTENU DE LA LANDING PAGE

### Header & Navigation
- ✅ Logo Kontiq
- ✅ Menu (Features, Tarifs, Demo)
- ✅ Bouton Connexion

### Hero Section
- ✅ Titre principal
- ✅ Sous-titre
- ✅ CTA buttons (Démo, Essai gratuit)

### Features Section
- ✅ 6 cartes de features
- ✅ Descriptions brèves
- ✅ Hover animations

### Pricing Section
- ✅ 3 plans de tarification (Starter, Professional, Enterprise)
- ✅ Bouton "Commencer" pour chaque plan
- ✅ Plan populaire surlignté
- ✅ Listes de features

### Demo Booking Section
- ✅ Formulaire de réservation
- ✅ Champs: Prénom, Nom, Email, Entreprise, Employés, Package, Message
- ✅ Modal de succès après soumission

### CTA Section
- ✅ Call-to-action final
- ✅ Encouragement à demander une démo

### Footer
- ✅ Copyright
- ✅ Coordonnées de contact

---

## 🔗 INTÉGRATION AVEC L'APPLICATION

### Boutons qui redirigent
- **"Connexion"** → `/auth/login.html`
- **"Essai gratuit"** → `/auth/register.html`
- **"Demander une démo"** → Scroll vers la section demo

### Formulaire de réservation
- Appelle `API.bookings.create(data)`
- Sauvegarde dans `data/bookings.json`
- Affiche un modal de succès
- Envoie un email (à implémenter)

### Sélection de package
- **Starter** - CHF 49/mois
- **Professional** - CHF 99/mois (populaire)
- **Enterprise** - Sur demande

---

## 📊 STRUCTURE DES DONNÉES

### Booking Object
```javascript
{
  id: "1704267045123",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  company: "Acme Corp",
  employees: "11-50",
  package: "Professional",
  message: "Très intéressé par la démo",
  status: "pending",
  created: "2026-01-03T14:30:45.123Z"
}
```

---

## 🎨 DESIGN & UX

### Couleurs principales
- Navy: `#0A2540`
- Teal: `#10B981`
- Light Gray: `#E5E7EB`

### Responsive Design
- ✅ Mobile (< 768px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (> 1024px)

### Animations
- ✅ Hover effects sur les cartes
- ✅ Scroll smooth
- ✅ Modal transitions
- ✅ Button transitions

---

## 🚀 PROCHAINES ÉTAPES

### À implémenter après
1. [ ] Envoyer email de confirmation de réservation
2. [ ] Admin panel pour gérer les réservations
3. [ ] Calendrier de disponibilités
4. [ ] Intégration avec Zoom/Teams pour la démo
5. [ ] Analytics/Tracking des conversions

### Optional
- [ ] Chat widget
- [ ] Témoignages clients
- [ ] Blog
- [ ] Pricing calculator
- [ ] FAQ section

---

## 💡 POINTS CLÉS

✅ Landing page complète et professionnelle
✅ Formulaire de réservation intégré
✅ Stockage des réservations en JSON
✅ Modal de confirmation
✅ Design responsive
✅ Prêt à accueillir les prospects

---

## 📞 SUPPORT

Si la landing page ne fonctionne pas:

1. **Vérifier que les fichiers existent:**
   - `public/landing.html`
   - `public/js/landing.js`
   - `public/js/api-client.js`
   - `data/bookings.json`

2. **Vérifier les routes API:**
   - POST `/api/bookings` existe
   - Fonctions helper `readBookings()` et `writeBookings()` existent

3. **Ouvrir console (F12):**
   - Vérifier pas d'erreurs JavaScript
   - Vérifier les logs

4. **Tester l'API directement:**
   ```bash
   curl -X GET http://localhost:3000/api/bookings
   ```

---

**Vous avez maintenant une landing page professionnelle prête à convertir vos prospects! 🚀**
