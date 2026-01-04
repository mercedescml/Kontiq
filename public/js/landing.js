/**
 * landing.js - Gestion de la page d'accueil (landing page)
 */

/**
 * Affiche une section spécifique
 */
function showSection(sectionId) {
  const allSections = document.querySelectorAll('.page-section');

  allSections.forEach(section => {
    const isTarget = section.id === 'section-' + sectionId;
    section.classList.toggle('active', isTarget);
    section.style.maxHeight = isTarget ? section.scrollHeight + 'px' : '0px';
    section.setAttribute('aria-expanded', isTarget ? 'true' : 'false');
  });
  
  // Mettre à jour la navigation active
  const allNavLinks = document.querySelectorAll('#navMenu a');
  allNavLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  const activeNavLink = document.getElementById('nav-' + sectionId);
  if (activeNavLink) {
    activeNavLink.classList.add('active');
  }
  
  // Scroll en haut de la page
  window.scrollTo(0, 0);
}

/**
 * Scroll vers la section de démonstration
 */
function scrollToDemo() {
  showSection('demo');
}

/**
 * Ouvre le formulaire de réservation avec le package pré-sélectionné
 */
function bookDemo(packageName) {
  showSection('demo');
  setTimeout(() => {
    document.getElementById('package').value = packageName;
    document.getElementById('firstName').focus();
  }, 100);
}

/**
 * Soumet la réservation de démo
 */
async function submitDemoBooking(event) {
  event.preventDefault();

  const formData = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    company: document.getElementById('company').value,
    employees: document.getElementById('employees').value,
    package: document.getElementById('package').value,
    message: document.getElementById('message').value,
    bookingDate: new Date().toISOString()
  };

  try {
    // Appeler l'API pour sauvegarder la réservation
    const result = await API.bookings.create(formData);
    
    // Afficher le modal de succès
    document.getElementById('confirmEmail').textContent = formData.email;
    document.getElementById('successModal').classList.add('active');

    // Réinitialiser le formulaire
    document.getElementById('demoForm').reset();

    // Fermer le modal après 5 secondes
    setTimeout(() => {
      closeModal();
    }, 5000);

  } catch (error) {
    console.error('Erreur lors de la réservation:', error);
    alert('Erreur: ' + error.message);
  }
}

/**
 * Ferme le modal de succès
 */
function closeModal() {
  document.getElementById('successModal').classList.remove('active');
}

/**
 * Toggle menu mobile
 */
function toggleMenu() {
  const navMenu = document.getElementById('navMenu');
  const menuToggle = document.getElementById('menuToggle');
  navMenu.classList.toggle('active');
  menuToggle.classList.toggle('active');
}

/**
 * Ferme le menu mobile
 */
function closeMenu() {
  const navMenu = document.getElementById('navMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (navMenu) navMenu.classList.remove('active');
  if (menuToggle) menuToggle.classList.remove('active');
}

/**
 * Ferme le modal quand on clique en dehors
 */
document.addEventListener('click', (e) => {
  const modal = document.getElementById('successModal');
  if (e.target === modal) {
    closeModal();
  }
  
  // Ferme le menu mobile si on clique en dehors
  const navMenu = document.getElementById('navMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (navMenu && menuToggle && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
    closeMenu();
  }
});

// Ajuster la hauteur de la section active lors des redimensionnements
window.addEventListener('resize', () => {
  const activeSection = document.querySelector('.page-section.active');
  if (activeSection) {
    activeSection.style.maxHeight = activeSection.scrollHeight + 'px';
  }
});

// Afficher la section home par défaut
document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
});

console.log('Landing page loaded');
