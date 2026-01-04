/**
 * vertrage.js - DÉSACTIVÉ
 * Le script inline dans vertrage.html gère tout le fonctionnement
 * Ce fichier est conservé comme référence uniquement
 */

// Vérifier si le script inline a déjà chargé les fonctions
if (typeof window.loadContracts === 'function') {
  console.log('vertrage.js: Script inline déjà chargé');
}

// Fonction d'init appelée par app.js - ne fait rien car le script inline gère tout
function vertrageInit() {
  console.log('vertrageInit: Script inline handles everything');
}
