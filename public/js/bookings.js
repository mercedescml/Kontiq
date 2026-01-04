/**
 * bookings.js - Gestion des réservations de démo
 */

let currentBookings = [];

/**
 * Charge toutes les réservations
 */
async function loadBookings() {
  try {
    const data = await API.bookings.getAll();
    currentBookings = data.bookings || [];
    displayBookings(currentBookings);
  } catch (error) {
    APP.notify('Erreur lors du chargement des réservations', 'error');
    console.error(error);
  }
}

/**
 * Affiche les réservations
 */
function displayBookings(bookings) {
  const container = document.querySelector('.bookings-list') || 
                   document.querySelector('[data-bookings-container]');
  
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280;">Aucune réservation pour le moment</p>';
    return;
  }

  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr style="border-bottom: 2px solid #E5E7EB;">';
  html += '<th style="text-align: left; padding: 10px;">Nom</th>';
  html += '<th style="text-align: left; padding: 10px;">Email</th>';
  html += '<th style="text-align: left; padding: 10px;">Entreprise</th>';
  html += '<th style="text-align: left; padding: 10px;">Package</th>';
  html += '<th style="text-align: left; padding: 10px;">Statut</th>';
  html += '<th style="text-align: left; padding: 10px;">Date</th>';
  html += '</tr></thead><tbody>';

  bookings.forEach(booking => {
    const date = new Date(booking.created).toLocaleDateString('de-CH');
    const statusColor = {
      'pending': '#F59E0B',
      'confirmed': '#10B981',
      'cancelled': '#EF4444'
    }[booking.status] || '#6B7280';

    html += `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px;">${booking.firstName} ${booking.lastName}</td>
        <td style="padding: 10px;">${booking.email}</td>
        <td style="padding: 10px;">${booking.company}</td>
        <td style="padding: 10px;">${booking.package}</td>
        <td style="padding: 10px;"><span style="color: ${statusColor}; font-weight: 600;">${booking.status}</span></td>
        <td style="padding: 10px;">${date}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bookings page loaded');
  loadBookings();
});
