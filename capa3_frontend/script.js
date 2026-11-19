/**
 * script.js - Capa 3: Presentación
 * Interfaz Gráfica para Evidenciar el Consumo de la API REST de Productos
 */

const RENDER_API_URL = 'https://ebackend-api.onrender.com/api/v1';
const LOCAL_API_URL = 'http://localhost:5050/api/v1';

// Determinar la API inicial de forma robusta
function getInitialApiUrl() {
  if (typeof window === 'undefined') return RENDER_API_URL;
  
  const urlParam = new URLSearchParams(window.location.search).get('api');
  if (urlParam) return urlParam;

  const saved = localStorage.getItem('API_BASE_URL');
  // Si estamos en GitHub Pages y en localStorage quedó un localhost viejo, descartarlo y forzar Render
  if (window.location.hostname.includes('github.io')) {
    if (saved && saved.startsWith('https://')) return saved;
    return RENDER_API_URL;
  }

  return saved || LOCAL_API_URL;
}

let API_BASE_URL = getInitialApiUrl();

// Estado global de la vista
const state = {
  page: 1,
  limit: 12,
  search: '',
  totalPages: 1,
  totalItems: 0,
  rawApiResponse: null,
};

// Referencias al DOM
const elements = {
  apiStatusPill: document.getElementById('apiStatusPill'),
  apiStatusText: document.getElementById('apiStatusText'),
  apiCurrentBadge: document.getElementById('apiCurrentBadge'),
  btnSwitchApi: document.getElementById('btnSwitchApi'),
  metricEndpoint: document.getElementById('metricEndpoint'),
  metricStatus: document.getElementById('metricStatus'),
  metricTime: document.getElementById('metricTime'),
  metricTotal: document.getElementById('metricTotal'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  limitSelect: document.getElementById('limitSelect'),
  productsGrid: document.getElementById('productsGrid'),
  paginationControls: document.getElementById('paginationControls'),
  btnViewCards: document.getElementById('btnViewCards'),
  btnViewJson: document.getElementById('btnViewJson'),
  cardsViewSection: document.getElementById('cardsViewSection'),
  jsonViewSection: document.getElementById('jsonViewSection'),
  jsonCodeOutput: document.getElementById('jsonCodeOutput'),
  btnCopyJson: document.getElementById('btnCopyJson'),
  btnOpenCreate: document.getElementById('btnOpenCreate'),
  createModal: document.getElementById('createModal'),
  createProductForm: document.getElementById('createProductForm'),
  toast: document.getElementById('toast'),
};

// Actualizar indicador visual de API
function updateApiBadge() {
  const isRender = API_BASE_URL.includes('onrender.com');
  if (elements.apiCurrentBadge) {
    elements.apiCurrentBadge.textContent = isRender ? 'Nube (Render)' : 'Local (5050)';
    elements.apiCurrentBadge.style.background = isRender ? '#059669' : '#d97706';
  }
}

// Utilidad simple de escape HTML (Anti-XSS)
const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag] || tag));
};

// Notificación Toast flotante
function notify(msg) {
  elements.toast.textContent = msg;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 3500);
}

// 1. COMPROBACIÓN DE SALUD DE LA API (GET /health)
async function verifyApiHealth() {
  updateApiBadge();
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      elements.apiStatusPill.className = 'status-pill online';
      const isRender = API_BASE_URL.includes('onrender.com');
      elements.apiStatusText.textContent = isRender ? 'API Render Online' : 'API Local Online (5050)';
    } else {
      throw new Error();
    }
  } catch {
    elements.apiStatusPill.className = 'status-pill offline';
    elements.apiStatusText.textContent = 'API Offline (Verifica backend)';
  }
}

// 2. OBTENER PRODUCTOS (GET /api/v1/productos)
async function fetchProducts() {
  const queryParams = new URLSearchParams({
    page: state.page,
    limit: state.limit,
  });
  if (state.search.trim()) {
    queryParams.append('search', state.search.trim());
  }

  const endpointText = `GET ${API_BASE_URL}/productos?${queryParams.toString()}`;
  elements.metricEndpoint.textContent = endpointText;
  elements.productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;">Consultando la API y PostgreSQL...</div>';

  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/productos?${queryParams.toString()}`);
    const duration = Math.round(performance.now() - startTime);
    const data = await response.json();

    state.rawApiResponse = data;

    // Actualizar métricas del monitor
    elements.metricStatus.textContent = `${response.status} ${response.statusText || 'OK'}`;
    elements.metricStatus.className = 'metric-value badge-status success';
    elements.metricTime.textContent = `${duration} ms`;

    if (data.success && data.data) {
      state.totalItems = data.pagination.totalItems;
      state.totalPages = data.pagination.totalPages;
      elements.metricTotal.textContent = `${state.totalItems.toLocaleString()} productos`;

      renderGrid(data.data);
      renderPagination(data.pagination);
      renderRawJson(data);
    } else {
      throw new Error(data.error?.message || 'Error en la respuesta de la API');
    }
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    elements.metricStatus.textContent = 'ERROR';
    elements.metricStatus.className = 'metric-value badge-status error';
    elements.metricTime.textContent = `${duration} ms`;

    elements.productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--danger);">
        <i class="bi bi-exclamation-octagon" style="font-size: 2.5rem;"></i>
        <h3 style="margin-top: 0.5rem;">No se pudo consultar la API de productos</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Endpoint: <code>${escapeHTML(API_BASE_URL)}</code></p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${escapeHTML(err.message)}</p>
        <div style="margin-top: 1rem;">
          <button onclick="toggleApiSource()" class="btn-primary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
            <i class="bi bi-arrow-repeat"></i> Cambiar servidor de API
          </button>
        </div>
      </div>
    `;
  }
}

// 3. RENDERIZAR REJILLA DE TARJETAS
function renderGrid(products) {
  if (products.length === 0) {
    elements.productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <i class="bi bi-search" style="font-size: 2.5rem; color: var(--text-muted);"></i>
        <p style="margin-top: 0.75rem; color: var(--text-muted);">No se encontraron productos que coincidan con la búsqueda.</p>
      </div>
    `;
    return;
  }

  elements.productsGrid.innerHTML = products.map((item) => `
    <article class="product-item">
      <div class="item-thumb">
        <span class="item-badge-id">ID: #${item.id}</span>
        <span class="item-badge-stock">Stock: ${item.stock}</span>
        <img 
          src="${escapeHTML(item.urlimagen)}" 
          alt="${escapeHTML(item.nombre)}"
          loading="lazy"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80';"
        >
      </div>
      <div class="item-info">
        <h3 class="item-title" title="${escapeHTML(item.nombre)}">${escapeHTML(item.nombre)}</h3>
        <p class="item-desc">${escapeHTML(item.descripcion)}</p>
        <div class="item-footer">
          <span class="item-price">$${parseFloat(item.pvp).toFixed(2)}</span>
          <button class="btn-delete" title="Eliminar producto (DELETE)" onclick="deleteProduct(${item.id})">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// 4. RENDERIZAR PAGINACIÓN
function renderPagination(pagination) {
  const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;
  if (totalPages <= 1) {
    elements.paginationControls.innerHTML = '';
    return;
  }

  let html = `
    <button class="page-btn" ${!hasPrevPage ? 'disabled' : ''} onclick="goToPage(1)" title="Primera página">
      <i class="bi bi-chevron-double-left"></i>
    </button>
    <button class="page-btn" ${!hasPrevPage ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})" title="Anterior">
      <i class="bi bi-chevron-left"></i>
    </button>
  `;

  const windowSize = window.innerWidth < 640 ? 1 : 2;
  const startPage = Math.max(1, currentPage - windowSize);
  const endPage = Math.min(totalPages, currentPage + windowSize);

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `
    <button class="page-btn" ${!hasNextPage ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})" title="Siguiente">
      <i class="bi bi-chevron-right"></i>
    </button>
    <button class="page-btn" ${!hasNextPage ? 'disabled' : ''} onclick="goToPage(${totalPages})" title="Última página">
      <i class="bi bi-chevron-double-right"></i>
    </button>
  `;

  elements.paginationControls.innerHTML = html;
}

// 5. NAVEGAR A PÁGINA
function goToPage(page) {
  if (page < 1 || page > state.totalPages || page === state.page) return;
  state.page = page;
  fetchProducts();
  window.scrollTo({ top: elements.cardsViewSection.offsetTop - 80, behavior: 'smooth' });
}

// 6. RENDERIZAR JSON CRUDO
function renderRawJson(data) {
  elements.jsonCodeOutput.textContent = JSON.stringify(data, null, 2);
}

// 7. CREAR PRODUCTO (POST)
elements.createProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    nombre: document.getElementById('newNombre').value.trim(),
    descripcion: document.getElementById('newDescripcion').value.trim(),
    pvp: parseFloat(document.getElementById('newPvp').value),
    stock: parseInt(document.getElementById('newStock').value, 10),
    urlimagen: document.getElementById('newImagen').value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.status === 201 && result.success) {
      elements.createModal.close();
      elements.createProductForm.reset();
      notify(`✅ Producto #${result.data.id} creado con éxito.`);
      state.page = 1;
      fetchProducts();
    } else {
      throw new Error(result.error?.message || 'Error al crear producto');
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

// 8. ELIMINAR PRODUCTO (DELETE)
async function deleteProduct(id) {
  if (!confirm(`¿Estás seguro de eliminar el producto #${id} de PostgreSQL?`)) return;

  try {
    const res = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: 'DELETE',
    });

    if (res.status === 204) {
      notify(`🗑️ Producto #${id} eliminado correctamente.`);
      fetchProducts();
    } else {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Error al eliminar');
    }
  } catch (err) {
    notify(`❌ Error: ${err.message}`);
  }
}

// Alternar entre API Render y API Localhost
function toggleApiSource() {
  if (API_BASE_URL.includes('onrender.com')) {
    API_BASE_URL = LOCAL_API_URL;
  } else {
    API_BASE_URL = RENDER_API_URL;
  }
  localStorage.setItem('API_BASE_URL', API_BASE_URL);
  updateApiBadge();
  state.page = 1;
  notify(`Cambiado a: ${API_BASE_URL}`);
  verifyApiHealth();
  fetchProducts();
}

// 9. EVENTOS DE CONTROL (BÚSQUEDA Y LÍMITE)
let searchTimer = null;
elements.searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page = 1;
    elements.clearSearchBtn.hidden = state.search === '';
    fetchProducts();
  }, 350);
});

elements.clearSearchBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  state.search = '';
  elements.clearSearchBtn.hidden = true;
  state.page = 1;
  fetchProducts();
});

elements.limitSelect.addEventListener('change', (e) => {
  state.limit = parseInt(e.target.value, 10);
  state.page = 1;
  fetchProducts();
});

// Botón para alternar API en navbar
if (elements.btnSwitchApi) {
  elements.btnSwitchApi.addEventListener('click', toggleApiSource);
}

// Pestañas: Alternar Vista Gráfica vs Vista JSON Crudo
elements.btnViewCards.addEventListener('click', () => {
  elements.btnViewCards.classList.add('active');
  elements.btnViewJson.classList.remove('active');
  elements.cardsViewSection.hidden = false;
  elements.jsonViewSection.hidden = true;
});

elements.btnViewJson.addEventListener('click', () => {
  elements.btnViewJson.classList.add('active');
  elements.btnViewCards.classList.remove('active');
  elements.cardsViewSection.hidden = true;
  elements.jsonViewSection.hidden = false;
});

// Copiar JSON
elements.btnCopyJson.addEventListener('click', () => {
  if (state.rawApiResponse) {
    navigator.clipboard.writeText(JSON.stringify(state.rawApiResponse, null, 2));
    notify('📋 JSON copiado al portapapeles');
  }
});

// Modal Crear
elements.btnOpenCreate.addEventListener('click', () => {
  elements.createModal.showModal();
});

// Ajuste al tamaño de ventana (Resize)
window.addEventListener('resize', () => {
  renderPagination({
    currentPage: state.page,
    totalPages: state.totalPages,
  });
});

// 10. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  verifyApiHealth();
  fetchProducts();
});
