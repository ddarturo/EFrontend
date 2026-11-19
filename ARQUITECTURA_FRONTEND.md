# Documento de Arquitectura y Diseño del Frontend
**Proyecto:** Sistema de Gestión y Catálogo de Productos (Capa 3: Presentación)  
**Tecnologías:** HTML5 Semántico, CSS3 Moderno (Grid / Flexbox / Clamp), JavaScript ES6+ (Fetch API)  
**Integración:** Backend REST API en `http://localhost:5050/api/v1`  
**Servidor de Desarrollo:** Live Server  

---

## 1. Visión General en la Arquitectura N-Capas

El frontend constituye la **Capa 3 (Presentación)** dentro del modelo N-Capas y Cliente-Servidor:

```
┌─────────────────────────────────────────────────────────────┐
│               CAPA 3: PRESENTACIÓN (Frontend)               │
│       index.html  │  style.css  │  script.js (Live Server)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Peticiones asíncronas HTTP (JSON)
                               │ Fetch API (GET, POST, PUT, PATCH, DELETE)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               CAPA 2: APLICACIONES (Backend)                │
│       Node.js + Express en Puerto 5050 (Arquitectura MVC)   │
│             http://localhost:5050/api/v1/productos          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Consultas SQL parametrizadas ($1)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  CAPA 1: DATOS (PostgreSQL)                 │
│              Tabla: producto (10.000 registros)             │
└─────────────────────────────────────────────────────────────┘
```

### Principios Fundamentales
1. **Desacoplamiento Total:** El frontend no conoce detalles de PostgreSQL; se comunica únicamente a través de contratos REST con respuestas JSON estructuradas.
2. **Diseño Líquido y Responsivo (Fluid & Adaptive Design):** La interfaz debe acomodar los 10.000 productos de manera fluida en cualquier resolución (desde móviles de 320px hasta monitores ultrawide de 4K), recalculando y recolocando columnas y elementos ante cualquier cambio de tamaño de ventana (`resize`).
3. **Estructura Minimalista y Modular:** Implementado con los 3 archivos nativos solicitados: `index.html`, `style.css` y `script.js`, sin necesidad de frameworks pesados.

---

## 2. Estructura de Archivos en `capa3_frontend/`

```
capa3_frontend/
├── index.html       # Esqueleto semántico, accesible y estructurado
├── style.css        # Sistema de diseño responsivo fluido (Grid, Flexbox, Variables)
└── script.js        # Lógica de consumo de API, gestión de estado y render reactivo
```

---

## 3. Estrategia de Responsividad: Adaptación Continua al Tamaño de Ventana

Para cumplir con el requerimiento de que **el contenido se adapte al tamaño de la ventana siempre que esta cambie**, se implementa una estrategia de **tres niveles complementarios**:

### 3.1. Nivel 1: CSS Grid Totalmente Fluido (`auto-fit` + `minmax`)
En lugar de depender exclusivamente de *media queries* fijas con saltos bruscos, el catálogo utiliza un contenedor CSS Grid intrínsecamente adaptativo:

```css
.products-grid {
  display: grid;
  /* Se adapta automáticamente al ancho del viewport sin saltos */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(1rem, 2vw, 2rem);
  width: 100%;
}
```
* **Comportamiento dinámico:** Cuando el usuario redimensiona la ventana en su escritorio:
  * Si la ventana mide **1600px**, automáticamente se muestran **4 o 5 columnas**.
  * Si reduce la ventana a **1000px**, se reorganiza al vuelo a **3 columnas**.
  * Si la reduce a **650px**, pasa a **2 columnas**.
  * Si la reduce a móvil (**< 400px**), pasa a **1 columna**.
  * **Todo esto ocurre en tiempo real durante el arrastre de la ventana**, sin requerir recargar la página.

### 3.2. Nivel 2: Tipografía y Espaciados Dinámicos con `clamp()`
Para que los títulos, botones y paddings crezcan y decrezcan en sincronía con la ventana:
```css
/* Escala tipográfica fluida entre pantallas pequeñas y grandes */
:root {
  --font-title: clamp(1.5rem, 3vw + 0.5rem, 2.75rem);
  --font-body: clamp(0.9rem, 1vw + 0.4rem, 1.05rem);
  --container-padding: clamp(1rem, 3vw, 3rem);
}
```

### 3.3. Nivel 3: Listener en JavaScript con `ResizeObserver` / `window.resize`
Para adaptar el comportamiento de la paginación según el tamaño de la ventana:
* En pantallas pequeñas o reducidas, el paginador reduce automáticamente la cantidad de botones numéricos visibles para evitar desbordamientos horizontales.
* Un observador `ResizeObserver` detecta el cambio de tamaño del contenedor del catálogo y ajusta la altura visual y el recorte de textos (`text-overflow`).

---

## 4. Desglose y Especificación de Cada Archivo

### 4.1. `index.html` (Estructura y Accesibilidad)
Contiene las áreas clave de la experiencia de usuario:
1. **Header & Navbar:**
   * Marca comercial e indicador de conexión en tiempo real con el backend (Health Check de `/api/v1/health`).
2. **Barra de Control y Búsqueda (Toolbar):**
   * Input de búsqueda con debouncing en tiempo real (`?search=...`).
   * Selector interactivo de productos por página (10, 20, 50, 100).
   * Contador de resultados (`Mostrando X de 10.000 productos`).
3. **Área Principal del Catálogo (`#productsGrid`):**
   * Contenedor reactivo donde se inyectan las tarjetas de productos o los *skeletons* de carga.
4. **Barra de Paginación Accesible (`#paginationControls`):**
   * Botones de Primera Página (`«`), Anterior (`‹`), números de página dinámicos, Siguiente (`›`) y Última (`»`).
5. **Modal Accesible de Producto (Detalle / CRUD):**
   * Diálogo modal HTML5 (`<dialog>` o contenedor accesible con `role="dialog"` y `aria-modal="true"`) para consultar o editar productos con `PUT` o `PATCH`.
6. **Toast de Notificaciones (`#toastContainer`):**
   * Retroalimentación visual al usuario cuando una acción es exitosa o si ocurre un error de red.

---

### 4.2. `style.css` (Diseño Moderno y Responsivo)
Estructurado mediante variables CSS (Custom Properties) para un tema limpio y profesional:

```css
:root {
  /* Paleta cromática */
  --color-primary: #1e3a8a;       /* Azul corporativo */
  --color-primary-hover: #1d4ed8;
  --color-accent: #f97316;        /* Naranja construcción / ferretería */
  --color-bg: #f8fafc;            /* Fondo gris claro suave */
  --color-surface: #ffffff;       /* Fondo de tarjetas */
  --color-text: #0f172a;          /* Texto principal */
  --color-muted: #64748b;         /* Texto secundario */
  --color-border: #e2e8f0;
  --color-success: #16a34a;
  --color-danger: #dc2626;

  /* Elevaciones / Sombras */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Transiciones */
  --transition-fast: 0.2s ease;
}
```

#### Características Clave del CSS:
* **Reset Moderno:** `box-sizing: border-box`, `margin: 0`, imágenes fluidas con `max-width: 100%; height: auto;`.
* **Sin Scroll Horizontal:** Contenedores con `width: 100%`, `overflow-x: hidden` a nivel global y anchos máximos elásticos (`max-width: min(1400px, 94vw)`).
* **Tarjetas de Producto Flexibles:** Cada tarjeta usa Flexbox en dirección columna (`display: flex; flex-direction: column`) para que el botón de acción quede alineado al fondo uniformemente, sin importar la longitud de la descripción.
* **Skeleton Loaders:** Animación de gradiente pulsante (efecto *shimmer*) mientras la API responde la consulta de productos.

---

### 4.3. `script.js` (Lógica y Comunicación REST)
Estructurado bajo el patrón **Module / State Management** en JavaScript puro:

```
┌─────────────────────────────────────────────────────────────┐
│                    OBJETO DE ESTADO (state)                 │
│   { page: 1, limit: 20, search: '', totalPages: 1, ... }    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│        API Service           │    │       Render Engine          │
│   - fetchProductos(params)   │    │   - renderCatalog(items)     │
│   - checkHealth()            │    │   - renderPagination(meta)   │
│   - createProducto(body)     │    │   - renderSkeletons()        │
│   - deleteProducto(id)       │    │   - showToast(msg, type)     │
└──────────────────────────────┘    └──────────────────────────────┘
```

#### Módulos Internos de `script.js`:
1. **Configuración y URLs:**
   ```javascript
   const API_BASE_URL = 'http://localhost:5050/api/v1';
   ```
2. **Estado Global Centralizado (`state`):**
   * Controla la página actual, límite por página, texto de búsqueda actual, total de ítems y estado de carga (`isLoading`).
3. **Cliente API (`apiClient`):**
   * Métodos asíncronos (`async/await`) con manejo defensivo de errores (`try/catch`).
   * Procesa las respuestas JSON del backend: `{ success, data, pagination, error }`.
4. **Búsqueda con Debounce:**
   * Evita saturar el backend con peticiones en cada pulsación de tecla. Espera **350ms** tras dejar de escribir antes de disparar la búsqueda en los 10.000 productos.
5. **Renderizador de Tarjetas:**
   * Genera el DOM de forma eficiente y segura, escapando caracteres para prevenir XSS.
   * Carga diferida de imágenes con `loading="lazy"`.
6. **Manejo Dinámico de Ventana (`resize` handler):**
   * Detecta el ancho disponible y compacta los números de la barra de paginación en pantallas estrechas.

---

## 5. Implementación Paso a Paso del Código

A continuación se presenta la propuesta concreta de código para cada uno de los 3 archivos:

### 5.1. Archivo: `capa3_frontend/index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Catálogo de productos de alta calidad - Arquitectura N-Capas">
  <title>Catálogo de Productos | Arquitectura N-Capas</title>
  
  <!-- Estilos principales -->
  <link rel="stylesheet" href="style.css">
  
  <!-- Iconos vectoriales rápidos (Bootstrap Icons CDN) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body>

  <!-- 1. Encabezado Principal y Estado del Backend -->
  <header class="app-header">
    <div class="header-container">
      <div class="brand">
        <i class="bi bi-boxes brand-icon"></i>
        <div>
          <h1>Ferretería<span>Pro</span></h1>
          <p class="subtitle">Catálogo de 10.000 Productos · Capa 3: Presentación</p>
        </div>
      </div>
      
      <!-- Indicador de conexión con el Backend (Puerto 5050) -->
      <div class="api-status" id="apiStatusBadge">
        <span class="status-dot"></span>
        <span class="status-text">Conectando...</span>
      </div>
    </div>
  </header>

  <!-- 2. Contenedor Principal Adaptativo -->
  <main class="main-container">
    
    <!-- Barra de Herramientas: Búsqueda, Filtros y Límite -->
    <section class="toolbar-section" aria-label="Controles del catálogo">
      <div class="search-box">
        <i class="bi bi-search search-icon"></i>
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Buscar entre 10.000 productos por nombre o descripción..."
          aria-label="Buscar productos"
        >
        <button id="clearSearchBtn" class="btn-clear" aria-label="Limpiar búsqueda" hidden>
          <i class="bi bi-x-circle-fill"></i>
        </button>
      </div>

      <div class="toolbar-actions">
        <!-- Selector de productos por página -->
        <label for="limitSelect" class="limit-label">Mostrar:</label>
        <select id="limitSelect" class="limit-select" aria-label="Productos por página">
          <option value="12">12</option>
          <option value="20" selected>20</option>
          <option value="48">48</option>
          <option value="100">100</option>
        </select>
        
        <span class="results-counter" id="resultsCounter">Cargando...</span>
      </div>
    </section>

    <!-- 3. Rejilla Dinámica de Productos (Auto-ajustable al tamaño de ventana) -->
    <section class="catalog-section" aria-label="Lista de productos">
      <div class="products-grid" id="productsGrid" aria-live="polite">
        <!-- Las tarjetas se generan dinámicamente mediante script.js -->
      </div>
    </section>

    <!-- 4. Controles de Paginación -->
    <nav class="pagination-nav" aria-label="Navegación de páginas">
      <div class="pagination-container" id="paginationContainer">
        <!-- Botones de paginación inyectados por script.js -->
      </div>
    </nav>

  </main>

  <!-- 5. Modal de Detalle de Producto -->
  <dialog id="productDialog" class="product-modal">
    <div class="modal-content" id="modalContent">
      <!-- Contenido inyectado dinámicamente al hacer clic en un producto -->
    </div>
  </dialog>

  <!-- 6. Contenedor de Notificaciones Toast -->
  <div class="toast-container" id="toastContainer" aria-live="assertive"></div>

  <!-- Script modular del frontend -->
  <script src="script.js"></script>
</body>
</html>
```

---

### 5.2. Archivo: `capa3_frontend/style.css`

```css
/* ==========================================================================
   RESET Y VARIABLES DE DISEÑO
   ========================================================================== */
:root {
  --color-primary: #1e3a8a;
  --color-primary-hover: #2563eb;
  --color-accent: #f97316;
  --color-accent-hover: #ea580c;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text-main: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-success: #16a34a;
  --color-danger: #dc2626;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 12px 20px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -4px rgba(0, 0, 0, 0.08);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* Espaciados y fuentes fluidas con clamp */
  --space-container: clamp(1rem, 2.5vw, 2.5rem);
  --font-h1: clamp(1.3rem, 2.2vw, 2rem);
  --font-card-title: clamp(1rem, 1.2vw, 1.15rem);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text-main);
  line-height: 1.5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ==========================================================================
   HEADER Y ESTADO DE LA API
   ========================================================================== */
.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: min(1440px, 94vw);
  margin: 0 auto;
  padding: 1rem var(--space-container);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  font-size: 2rem;
  color: var(--color-accent);
}

.brand h1 {
  font-size: var(--font-h1);
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-primary);
}

.brand h1 span {
  color: var(--color-accent);
}

.brand .subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.api-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: #f1f5f9;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #94a3b8;
  transition: background 0.3s ease;
}

.api-status.online .status-dot { background: var(--color-success); box-shadow: 0 0 8px var(--color-success); }
.api-status.offline .status-dot { background: var(--color-danger); }

/* ==========================================================================
   MAIN CONTAINER Y TOOLBAR (AJUSTABLES)
   ========================================================================== */
.main-container {
  max-width: min(1440px, 94vw);
  margin: 0 auto;
  padding: var(--space-container);
  width: 100%;
  flex: 1;
}

.toolbar-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap; /* Se envuelve automáticamente al reducir la ventana */
}

.search-box {
  position: relative;
  flex: 1 1 320px; /* Crece y decrece según el ancho */
  max-width: 600px;
}

.search-box input {
  width: 100%;
  padding: 0.85rem 2.8rem 0.85rem 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary-hover);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.btn-clear {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.limit-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.limit-select {
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-weight: 600;
  color: var(--color-text-main);
  cursor: pointer;
}

.results-counter {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* ==========================================================================
   REJILLA DE PRODUCTOS (GRID RESPONSIVO FLUIDO)
   ========================================================================== */
.products-grid {
  display: grid;
  /* La magia responsiva: se adapta continuamente al tamaño de ventana */
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: clamp(1rem, 2vw, 1.75rem);
  width: 100%;
}

/* Tarjeta individual */
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.product-image-wrap {
  width: 100%;
  aspect-ratio: 4 / 3; /* Mantiene proporción idéntica en cualquier pantalla */
  overflow: hidden;
  background: #f1f5f9;
  position: relative;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.stock-tag {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: rgba(15, 23, 42, 0.8);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.product-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-id {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.product-title {
  font-size: var(--font-card-title);
  font-weight: 700;
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text-main);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-desc {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1; /* Empuja el precio y botón al fondo */
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.product-price {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-primary);
}

.product-price small {
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-detail {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background var(--transition-fast);
}

.btn-detail:hover {
  background: var(--color-primary-hover);
}

/* ==========================================================================
   PAGINACIÓN RESPONSIVA
   ========================================================================== */
.pagination-nav {
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
}

.pagination-container {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: center;
}

.page-btn {
  min-width: 40px;
  height: 40px;
  padding: 0 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ==========================================================================
   SKELETON LOADERS (ESTADO DE CARGA)
   ========================================================================== */
.skeleton-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  height: 380px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; background-color: #f1f5f9; }
  50% { opacity: 1; background-color: #e2e8f0; }
  100% { opacity: 0.6; background-color: #f1f5f9; }
}

/* ==========================================================================
   TOASTS Y DIALOG MODAL
   ========================================================================== */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius-md);
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
}

.toast.success { background: var(--color-success); }
.toast.error { background: var(--color-danger); }

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

### 5.3. Archivo: `capa3_frontend/script.js`

```javascript
/**
 * ============================================================================
 * script.js - Capa 3: Presentación
 * Arquitectura N-Capas / Cliente-Servidor REST
 * ============================================================================
 */

// 1. CONFIGURACIÓN Y ESTADO DE LA APLICACIÓN
const CONFIG = {
  API_BASE_URL: 'http://localhost:5050/api/v1',
  DEFAULT_LIMIT: 20,
  DEBOUNCE_DELAY: 350, // Milisegundos de espera para búsqueda
};

const state = {
  page: 1,
  limit: CONFIG.DEFAULT_LIMIT,
  search: '',
  totalPages: 1,
  totalItems: 0,
  isLoading: false,
};

// 2. REFERENCIAS AL DOM
const elements = {
  apiStatusBadge: document.getElementById('apiStatusBadge'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  limitSelect: document.getElementById('limitSelect'),
  resultsCounter: document.getElementById('resultsCounter'),
  productsGrid: document.getElementById('productsGrid'),
  paginationContainer: document.getElementById('paginationContainer'),
  productDialog: document.getElementById('productDialog'),
  modalContent: document.getElementById('modalContent'),
  toastContainer: document.getElementById('toastContainer'),
};

// 3. UTILIDADES (Sanitización y Debounce)
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

let debounceTimer = null;
const debounce = (callback, delay) => {
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => callback(...args), delay);
  };
};

// 4. CLIENTE API REST (Comunicación con Capa 2)
const apiClient = {
  async checkHealth() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/health`);
      if (!res.ok) throw new Error('API no disponible');
      return true;
    } catch {
      return false;
    }
  },

  async fetchProducts({ page = 1, limit = 20, search = '' }) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search.trim()) {
      params.append('search', search.trim());
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}/productos?${params}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }
    return await response.json();
  },

  async fetchProductById(id) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/productos/${id}`);
    if (!response.ok) throw new Error('Producto no encontrado');
    return await response.json();
  }
};

// 5. RENDERIZADORES DE LA INTERFAZ
function renderSkeletons(count = 8) {
  elements.productsGrid.innerHTML = Array(count)
    .fill('<div class="skeleton-card"></div>')
    .join('');
}

function renderProducts(items) {
  if (!items || items.length === 0) {
    elements.productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <i class="bi bi-inbox" style="font-size: 3rem; color: var(--color-text-muted);"></i>
        <h3 style="margin-top: 1rem;">No se encontraron productos</h3>
        <p style="color: var(--color-text-muted);">Intenta ajustar el término de búsqueda.</p>
      </div>
    `;
    return;
  }

  elements.productsGrid.innerHTML = items.map((p) => `
    <article class="product-card" data-id="${p.id}" tabindex="0">
      <div class="product-image-wrap">
        <img 
          src="${escapeHTML(p.urlimagen)}" 
          alt="${escapeHTML(p.nombre)}"
          class="product-image"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&q=80'"
        >
        <span class="stock-tag">${p.stock} unid.</span>
      </div>
      <div class="product-content">
        <span class="product-id">SKU #${p.id}</span>
        <h2 class="product-title">${escapeHTML(p.nombre)}</h2>
        <p class="product-desc">${escapeHTML(p.descripcion)}</p>
        <div class="product-footer">
          <div class="product-price">
            <small>$</small>${Number(p.pvp).toFixed(2)}
          </div>
          <button class="btn-detail" onclick="viewProductDetail(${p.id})">
            Ver más <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderPagination({ currentPage, totalPages }) {
  if (totalPages <= 1) {
    elements.paginationContainer.innerHTML = '';
    return;
  }

  // Detecta el ancho disponible para mostrar más o menos botones numéricos
  const isCompact = window.innerWidth < 640;
  const maxButtons = isCompact ? 3 : 7;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  let html = `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(1)" title="Primera página">
      <i class="bi bi-chevron-double-left"></i>
    </button>
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})" title="Página anterior">
      <i class="bi bi-chevron-left"></i>
    </button>
  `;

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})" title="Página siguiente">
      <i class="bi bi-chevron-right"></i>
    </button>
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${totalPages})" title="Última página">
      <i class="bi bi-chevron-double-right"></i>
    </button>
  `;

  elements.paginationContainer.innerHTML = html;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// 6. CONTROLADOR DE CARGA DE DATOS
async function loadCatalog() {
  if (state.isLoading) return;
  state.isLoading = true;
  renderSkeletons(state.limit);

  try {
    const response = await apiClient.fetchProducts({
      page: state.page,
      limit: state.limit,
      search: state.search,
    });

    state.totalItems = response.pagination.totalItems;
    state.totalPages = response.pagination.totalPages;

    renderProducts(response.data);
    renderPagination(response.pagination);

    elements.resultsCounter.textContent = `Mostrando ${response.data.length} de ${state.totalItems} productos`;
  } catch (err) {
    elements.productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 3rem;">
        <i class="bi bi-exclamation-triangle" style="font-size: 2.5rem;"></i>
        <h3>Error al conectar con el Backend</h3>
        <p>${escapeHTML(err.message)}</p>
        <button class="btn-detail" style="margin-top: 1rem;" onclick="loadCatalog()">Reintentar</button>
      </div>
    `;
    elements.resultsCounter.textContent = 'Error';
    showToast(err.message, 'error');
  } finally {
    state.isLoading = false;
  }
}

// 7. ACCIONES Y EVENT LISTENERS
window.goToPage = (targetPage) => {
  if (targetPage < 1 || targetPage > state.totalPages || targetPage === state.page) return;
  state.page = targetPage;
  loadCatalog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.viewProductDetail = async (id) => {
  try {
    const res = await apiClient.fetchProductById(id);
    const p = res.data;
    elements.modalContent.innerHTML = `
      <div style="padding: 1.5rem;">
        <img src="${escapeHTML(p.urlimagen)}" style="width: 100%; border-radius: 8px; max-height: 300px; object-fit: cover;">
        <h2 style="margin: 1rem 0 0.5rem;">${escapeHTML(p.nombre)}</h2>
        <p style="color: var(--color-text-muted); margin-bottom: 1rem;">${escapeHTML(p.descripcion)}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 1.5rem; color: var(--color-primary);">$${Number(p.pvp).toFixed(2)}</strong>
          <span>Stock: <strong>${p.stock}</strong></span>
        </div>
        <button class="btn-detail" style="width: 100%; margin-top: 1.5rem;" onclick="elements.productDialog.close()">Cerrar</button>
      </div>
    `;
    elements.productDialog.showModal();
  } catch (err) {
    showToast('No se pudo cargar el detalle del producto', 'error');
  }
};

// Búsqueda en tiempo real con debounce
elements.searchInput.addEventListener('input', debounce((e) => {
  state.search = e.target.value.trim();
  state.page = 1; // Reinicia a la primera página
  elements.clearSearchBtn.hidden = state.search === '';
  loadCatalog();
}, CONFIG.DEBOUNCE_DELAY));

elements.clearSearchBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  state.search = '';
  elements.clearSearchBtn.hidden = true;
  state.page = 1;
  loadCatalog();
});

elements.limitSelect.addEventListener('change', (e) => {
  state.limit = parseInt(e.target.value, 10);
  state.page = 1;
  loadCatalog();
});

// Listener de Redimensionamiento de Ventana (Window Resize)
window.addEventListener('resize', debounce(() => {
  // Recalcula la paginación según el nuevo ancho de pantalla
  renderPagination({
    currentPage: state.page,
    totalPages: state.totalPages,
  });
}, 150));

// 8. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
  // Comprobación de estado del Backend (Health Check)
  const isHealthy = await apiClient.checkHealth();
  if (isHealthy) {
    elements.apiStatusBadge.classList.add('online');
    elements.apiStatusBadge.querySelector('.status-text').textContent = 'Backend Online (5050)';
  } else {
    elements.apiStatusBadge.classList.add('offline');
    elements.apiStatusBadge.querySelector('.status-text').textContent = 'Backend Offline';
  }

  // Carga inicial de productos
  loadCatalog();
});
```

---

## 6. Checklist de Buenas Prácticas y Criterios Cumplidos

| Requerimiento | Solución Implementada en el Diseño |
| :--- | :--- |
| **Ajuste continuo al tamaño de ventana** | `repeat(auto-fill, minmax(min(100%, 280px), 1fr))` + `clamp()` + listener de `resize` reactivo. Cero scrollbars horizontales. |
| **Consumo de Backend REST (`ARQUITECTURA_BACKEND.md`)** | Conexión con `http://localhost:5050/api/v1/productos`, paginación nativa y soporte para los 10.000 productos. |
| **Separación limpia de 3 archivos** | `index.html` (semántica), `style.css` (diseño fluido), `script.js` (cliente REST y estado). |
| **Seguridad Frontend** | Sanitización con `escapeHTML()` contra inyecciones XSS. |
| **Rendimiento con 10.000 registros** | Búsqueda con debounce (350ms) y paginación del servidor (nunca se descargan los 10.000 de golpe). |
| **Carga Diferida (Lazy Loading)** | Atributo `loading="lazy"` en todas las imágenes para optimizar ancho de banda. |
