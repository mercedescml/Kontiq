/**
 * Forderungen Kategorien Module
 * Handles category assignment for invoices
 */

let forderungenKategorien = [];

// Load kategorien on page load
async function loadForderungenKategorien() {
    try {
        const response = await fetch('/api/forderungen-kategorien');
        if (!response.ok) throw new Error('Fehler beim Laden der Kategorien');

        forderungenKategorien = await response.json();
        return forderungenKategorien;
    } catch (error) {
        console.error('Error loading forderungen kategorien:', error);
        return [];
    }
}

// Get kategorie by ID
function getKategorieById(id) {
    return forderungenKategorien.find(k => k.id === id);
}

// Get kategorie badge HTML
function getKategorieBadge(kategorieId) {
    if (!kategorieId) {
        return '<span class="kategorie-badge uncategorized">Nicht kategorisiert</span>';
    }

    const kategorie = getKategorieById(kategorieId);
    if (!kategorie) {
        return '<span class="kategorie-badge uncategorized">Nicht kategorisiert</span>';
    }

    return `<span class="kategorie-badge">
        ${kategorie.name}
    </span>`;
}

// Render kategorie selector
function renderKategorieSelector(currentKategorieId = null) {
    const options = forderungenKategorien.map(kat => {
        const selected = kat.id === currentKategorieId ? 'selected' : '';
        return `<option value="${kat.id}" ${selected}>${kat.name}</option>`;
    }).join('');

    return `
        <select class="kategorie-select">
            <option value="">Nicht kategorisiert</option>
            ${options}
        </select>
    `;
}

// Open category assignment modal
function openKategorieAssignModal(forderungId, currentKategorieId = null) {
    const modalHTML = `
        <div class="modal-overlay" id="kategorie-assign-modal" onclick="closeKategorieAssignModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Kategorie zuweisen</h3>
                    <button class="btn-close" onclick="closeKategorieAssignModal()">×</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1rem; color: #666;">
                        Wählen Sie eine Kategorie für diese Forderung:
                    </p>
                    <div class="kategorie-options">
                        ${forderungenKategorien.map(kat => `
                            <div class="kategorie-option ${kat.id === currentKategorieId ? 'selected' : ''}"
                                 data-kategorie-id="${kat.id}"
                                 onclick="selectKategorie('${kat.id}', '${forderungId}')">
                                <div class="kategorie-option-icon"></div>
                                <div class="kategorie-option-info">
                                    <div class="kategorie-option-name">${kat.name}</div>
                                    <div class="kategorie-option-description">${kat.description || ''}</div>
                                </div>
                            </div>
                        `).join('')}
                        ${currentKategorieId ? `
                            <div class="kategorie-option"
                                 data-kategorie-id=""
                                 onclick="selectKategorie('', '${forderungId}')">
                                <div class="kategorie-option-icon" style="background-color: var(--gray);"></div>
                                <div class="kategorie-option-info">
                                    <div class="kategorie-option-name">Kategorie entfernen</div>
                                    <div class="kategorie-option-description">Forderung nicht kategorisieren</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existing = document.getElementById('kategorie-assign-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function selectKategorie(kategorieId, forderungId) {
    try {
        // Update forderung with kategorie
        const response = await fetch(`/api/forderungen/${forderungId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kategorie: kategorieId || null })
        });

        if (!response.ok) throw new Error('Fehler beim Zuweisen der Kategorie');

        // Close modal
        closeKategorieAssignModal();

        // Reload forderungen list
        if (typeof loadForderungen === 'function') {
            loadForderungen();
        }

        // Show success message
        showNotification('Kategorie erfolgreich zugewiesen', 'success');

    } catch (error) {
        console.error('Error assigning kategorie:', error);
        showNotification('Fehler beim Zuweisen der Kategorie', 'error');
    }
}

function closeKategorieAssignModal(event) {
    if (event && event.target.classList.contains('modal')) {
        return; // Don't close if clicking inside modal
    }
    const modal = document.getElementById('kategorie-assign-modal');
    if (modal) modal.remove();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--teal)' : 'var(--navy)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for kategorie features
const kategorienCSS = document.createElement('style');
kategorienCSS.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }

    .kategorie-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        color: var(--gray);
        background: var(--light-gray);
        border: 1px solid var(--border-gray);
        white-space: nowrap;
        letter-spacing: 0.3px;
        font-family: 'Inter', sans-serif;
    }

    .kategorie-badge.uncategorized {
        color: var(--gray);
        background: var(--light-gray);
    }

    .kategorie-select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-gray);
        border-radius: 8px;
        font-size: 13px;
        font-family: 'Inter', sans-serif;
    }

    .kategorie-options {
        display: grid;
        gap: 0.75rem;
        max-height: 60vh;
        overflow-y: auto;
    }

    .kategorie-option {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 2px solid var(--border-gray);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .kategorie-option:hover {
        border-color: var(--teal);
        background: var(--light-gray);
    }

    .kategorie-option.selected {
        border-color: var(--teal);
        background: var(--light-gray);
    }

    .kategorie-option-icon {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--gray);
        flex-shrink: 0;
        margin-top: 6px;
    }

    .kategorie-option-info {
        flex: 1;
    }

    .kategorie-option-name {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 0.25rem;
        color: var(--navy);
        font-family: 'Inter', sans-serif;
    }

    .kategorie-option-description {
        font-size: 11px;
        color: var(--gray);
        font-family: 'Inter', sans-serif;
    }
`;
document.head.appendChild(kategorienCSS);

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadForderungenKategorien);
} else {
    loadForderungenKategorien();
}
