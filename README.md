# EFrontend - Capa 3: Presentación

[![Frontend CI](https://github.com/ddarturo/EFrontend/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ddarturo/EFrontend/actions/workflows/frontend-ci.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://ddarturo.github.io/EFrontend/)

Interfaz gráfica web adaptativa y responsiva para el Sistema de Gestión y Catálogo de Productos (Capa 3: Presentación).

---

## 🌐 Demo en Vivo (GitHub Pages)

Puedes acceder a la interfaz desplegada directamente en:
👉 **[https://ddarturo.github.io/EFrontend/](https://ddarturo.github.io/EFrontend/)**

---

## 🏛️ Características y Arquitectura Frontend

- **Tecnologías:** HTML5 Semántico, CSS3 Moderno (CSS Grid con `auto-fit`/`clamp`), JavaScript ES6+ (Fetch API).
- **Consumo RESTful:** Integración asíncrona con el backend (EBackend) en `http://localhost:5050/api/v1` (o configurable por parámetro `?api=...`).
- **Diseño 100% Adaptativo al Tamaño de Ventana:**
  - Redimensionamiento fluido en tiempo real sin recargar página.
  - Rejilla responsiva con CSS Grid intrínseco.
  - Monitor de peticiones HTTP en tiempo real con alternador entre **Vista de Tarjetas** y **Visor de JSON Crudo**.
  - Modal accesible para pruebas de creación de productos (`POST`).

---

## 📂 Estructura del Repositorio

```text
EFrontend/
├── capa3_frontend/
│   ├── index.html       # Estructura semántica, accesibilidad y modales
│   ├── script.js        # Consumo de API REST, debounce, paginación reactiva
│   └── style.css        # Sistema de diseño responsivo fluido y variables CSS
├── .github/
│   └── workflows/
│       └── frontend-ci.yml # Pipeline CI en GitHub Actions y despliegue a GitHub Pages
├── ARQUITECTURA_FRONTEND.md # Especificación completa de diseño y responsividad
├── index.html           # Redirección accesible hacia capa3_frontend/
└── README.md            # Documentación del frontend
```

---

## 💻 Ejecución Local

Puedes abrir el proyecto localmente de dos formas sencillas:
1. Con **Live Server** en VS Code o Antigravity abriendo `capa3_frontend/index.html`.
2. Con cualquier servidor estático:
   ```bash
   npx serve .
   ```
   o con Python:
   ```bash
   python3 -m http.server 8080
   ```
