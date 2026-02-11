/**
 * helpers.js - Generic utility functions to reduce code duplication
 */

/**
 * Generic data loading with cache support
 * @param {string} resource - Resource name (e.g., 'forderungen', 'kosten')
 * @param {function} displayFn - Function to display the data
 * @param {string} dataKey - Key in response object (e.g., 'forderungen', 'kosten')
 * @returns {Promise<Array>} The loaded data
 */
async function loadDataWithCache(resource, displayFn, dataKey) {
  try {
    let data;

    // Try to use cache if available
    if (typeof DataPreloader !== 'undefined' && DataPreloader.cache.has(resource)) {
      data = DataPreloader.cache.get(resource);
    } else {
      // Fetch from API
      data = await API[resource].getAll();
    }

    const items = data[dataKey] || [];

    // Display the data using provided function
    if (displayFn) {
      displayFn(items);
    }

    return items;
  } catch (error) {
    console.error(`Error loading ${resource}:`, error);
    APP.notify && APP.notify(`Fehler beim Laden der ${resource}`, 'error');
    return [];
  }
}

/**
 * Generic modal creation
 * @param {Object} config - Modal configuration
 * @param {string} config.id - Modal ID
 * @param {string} config.title - Modal title
 * @param {Array<Object>} config.fields - Form fields configuration
 * @param {function} config.onSubmit - Submit handler function name (as string)
 * @param {function} config.onClose - Close handler function name (as string)
 * @returns {HTMLElement} The created modal element
 */
function createGenericModal(config) {
  const modal = document.createElement('div');
  modal.id = config.id;
  modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; align-items: center; justify-content: center;';

  // Build form fields HTML
  let fieldsHTML = '';
  config.fields.forEach(field => {
    const gridSpan = field.fullWidth ? 'grid-column: span 2;' : '';
    fieldsHTML += `
      <div style="${gridSpan} margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">${field.label}</label>
        ${field.type === 'select' ?
          `<select id="${field.id}" ${field.required ? 'required' : ''} style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;">
            ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>` :
          field.type === 'textarea' ?
          `<textarea id="${field.id}" ${field.required ? 'required' : ''} rows="${field.rows || 3}" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;" placeholder="${field.placeholder || ''}"></textarea>` :
          `<input type="${field.type}" id="${field.id}" ${field.required ? 'required' : ''} ${field.step ? `step="${field.step}"` : ''} ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.max !== undefined ? `max="${field.max}"` : ''} style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 8px;" placeholder="${field.placeholder || ''}">`
        }
      </div>
    `;
  });

  modal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: ${config.maxWidth || '600px'}; width: 90%; max-height: 90vh; overflow-y: auto;">
      <h3 class="modal-title" style="margin: 0 0 20px 0;">${config.title}</h3>
      <form onsubmit="${config.onSubmit}(event)">
        <input type="hidden" id="${config.idFieldName || 'itemId'}">
        <div style="display: grid; grid-template-columns: ${config.singleColumn ? '1fr' : '1fr 1fr'}; gap: 16px;">
          ${fieldsHTML}
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button type="button" onclick="${config.onClose}()" style="padding: 10px 20px; border: 1px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer;">Abbrechen</button>
          <button type="submit" style="padding: 10px 20px; background: #0EB17A; color: white; border: none; border-radius: 8px; cursor: pointer;">Speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

/**
 * Generic modal close handler with form reset
 * @param {string} modalId - ID of modal to close
 * @param {string} idFieldName - Name of the ID field to clear
 */
function closeGenericModal(modalId, idFieldName = 'itemId') {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.style.display = 'none';

  // Reset form
  const form = modal.querySelector('form');
  if (form) form.reset();

  // Clear ID field
  const idField = document.getElementById(idFieldName);
  if (idField) idField.value = '';
}

/**
 * Generic edit handler - populates modal with data
 * @param {string} modalId - ID of modal
 * @param {Object} item - Item data to populate
 * @param {Object} fieldMapping - Mapping of data keys to form field IDs
 * @param {string} title - Modal title for edit mode
 */
function populateModalForEdit(modalId, item, fieldMapping, title) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Populate fields based on mapping
  Object.entries(fieldMapping).forEach(([dataKey, fieldId]) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = item[dataKey] || '';
    }
  });

  // Update modal title
  const modalTitle = modal.querySelector('.modal-title');
  if (modalTitle) modalTitle.textContent = title;

  // Show modal
  modal.style.display = 'flex';

  // Focus first input
  const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
  if (firstInput) firstInput.focus();
}
