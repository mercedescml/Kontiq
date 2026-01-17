/**
 * bookings.js - Demo Bookings Management
 * Displays all demo booking submissions from the landing page
 */

let currentBookings = [];

/**
 * Load all bookings
 */
async function loadBookings() {
  try {
    const response = await fetch('/api/bookings');
    const data = await response.json();
    currentBookings = data.bookings || [];

    // Sort by date (newest first)
    currentBookings.sort((a, b) => {
      const dateA = new Date(a.bookingDate || a.createdAt || 0);
      const dateB = new Date(b.bookingDate || b.createdAt || 0);
      return dateB - dateA;
    });

    displayBookings(currentBookings);
    updateStats(currentBookings);
  } catch (error) {
    console.error('Error loading bookings:', error);
    APP.notify('Fehler beim Laden der Buchungen', 'error');
  }
}

/**
 * Display bookings in table
 */
function displayBookings(bookings) {
  const container = document.getElementById('bookingsContainer');

  if (!container) {
    console.warn('Bookings container not found');
    return;
  }

  if (!bookings || bookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Keine Buchungen</h3>
        <p>Es wurden noch keine Demo-Buchungen eingereicht.</p>
      </div>
    `;
    return;
  }

  let html = '';
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  bookings.forEach((booking, idx) => {
    const bookingDate = new Date(booking.bookingDate || booking.createdAt || now);
    const isNew = bookingDate > oneDayAgo;
    const formattedDate = bookingDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const packageBadge = booking.package ? getBadgeClass(booking.package) : 'badge';
    const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Unbekannt';
    const email = booking.email || '-';
    const company = booking.company || '-';
    const employees = booking.employees || '-';
    const packageName = booking.package || '-';
    const message = booking.message || 'Keine Nachricht';
    const shortMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
    const bookingId = booking.id || idx;

    html += `
      <div class="booking-row ${isNew ? 'new' : ''}">
        <div class="client-name">${fullName}</div>
        <div>${email}</div>
        <div>${company}</div>
        <div>${employees}</div>
        <div><span class="${packageBadge}">${packageName}</span></div>
        <div>${formattedDate}</div>
        <div title="${message}">${shortMessage}</div>
        <div>
          <button class="btn-action" onclick="viewBookingDetails('${bookingId}')">Details</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Get badge class based on package type
 */
function getBadgeClass(packageName) {
  const lower = packageName.toLowerCase();
  if (lower.includes('starter')) return 'badge badge-starter';
  if (lower.includes('professional')) return 'badge badge-professional';
  if (lower.includes('enterprise')) return 'badge badge-enterprise';
  return 'badge badge-starter';
}

/**
 * Update statistics
 */
function updateStats(bookings) {
  // Total bookings
  const totalEl = document.getElementById('totalBookings');
  if (totalEl) totalEl.textContent = bookings.length;

  // This week
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = bookings.filter(b => {
    const date = new Date(b.bookingDate || b.createdAt || 0);
    return date >= weekAgo;
  });
  const weekEl = document.getElementById('weekBookings');
  if (weekEl) weekEl.textContent = thisWeek.length;

  // Starter count
  const starterCount = bookings.filter(b =>
    (b.package || '').toLowerCase().includes('starter')
  ).length;
  const starterEl = document.getElementById('starterCount');
  if (starterEl) starterEl.textContent = starterCount;

  // Professional count
  const professionalCount = bookings.filter(b =>
    (b.package || '').toLowerCase().includes('professional')
  ).length;
  const professionalEl = document.getElementById('professionalCount');
  if (professionalEl) professionalEl.textContent = professionalCount;
}

/**
 * View booking details
 */
function viewBookingDetails(bookingId) {
  const booking = currentBookings.find((b, idx) =>
    (b.id === bookingId) || (idx.toString() === bookingId)
  );

  if (!booking) {
    APP.notify('Buchung nicht gefunden', 'error');
    return;
  }

  const fullName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
  const bookingDate = new Date(booking.bookingDate || booking.createdAt || Date.now());
  const formattedDate = bookingDate.toLocaleString('de-DE');

  const details = `
Demo Buchung Details:

Name: ${fullName}
Email: ${booking.email || '-'}
Firma: ${booking.company || '-'}
Mitarbeiter: ${booking.employees || '-'}
Paket: ${booking.package || '-'}
Datum: ${formattedDate}

Nachricht:
${booking.message || 'Keine Nachricht'}
  `.trim();

  alert(details);
}

/**
 * Refresh bookings
 */
async function refreshBookings() {
  APP.notify('Buchungen werden aktualisiert...', 'info');
  await loadBookings();
  APP.notify('Buchungen aktualisiert', 'success');
}

/**
 * Export bookings to CSV
 */
function exportBookings() {
  if (currentBookings.length === 0) {
    APP.notify('Keine Buchungen zum Exportieren', 'warning');
    return;
  }

  // Create CSV content
  const headers = ['Name', 'Vorname', 'Email', 'Firma', 'Mitarbeiter', 'Paket', 'Datum', 'Nachricht'];
  const csvContent = [
    headers.join(';'),
    ...currentBookings.map(b => {
      const date = new Date(b.bookingDate || b.createdAt || '');
      return [
        b.lastName || '',
        b.firstName || '',
        b.email || '',
        b.company || '',
        b.employees || '',
        b.package || '',
        date.toLocaleDateString('de-DE'),
        (b.message || '').replace(/[\r\n]/g, ' ')
      ].join(';');
    })
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `demo-buchungen-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  APP.notify('Buchungen exportiert', 'success');
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Bookings page loaded');
  loadBookings();
});
