# Walkthrough: Estructura del Proyecto de Grado Integrado

Se ha completado la configuración inicial del entorno de desarrollo siguiendo fielmente la estructura solicitada.

## 🚀 Tecnologías Implementadas
*   **Backend**: Node.js, TypeScript, Express, Prisma ORM.
*   **Frontend**: React, Vite, TypeScript, Tailwind CSS.
*   **Herramientas**: Biome (Linting/Formateo), Docker (Configuración base).

## 📂 Organización de Carpetas

### Estructura del Backend
La carpeta `backend/src` contiene la lógica separada por responsabilidades:
*   `controllers/`: Manejo de peticiones HTTP.
*   `services/`: Lógica de negocio (Consultas, Caja, Inventario).
*   `models/`: Definición de tipos de datos de Prisma.
*   `routes/`: Definición de endpoints de la API.

### Estructura del Frontend
La carpeta `frontend/src` está organizada para escalabilidad:
*   `api/`: Funciones para llamar al backend.
*   `components/`: Componentes UI reutilizables.
*   `pages/`: Vistas principales (Dashboard, Caja, Farmacia).
*   `hooks/`: Lógica compartida de React.

## ✅ Estado de la Fase 1
- [x] Estructura de carpetas creada.
- [x] Backend inicializado con `npm` y `Prisma`.
- [x] Frontend inicializado con `Vite` y `Tailwind CSS`.
- [x] Archivos base (`server.ts`, [App.tsx](file:///c:/Disco%20D/PROYECTO%20VET/HOSPTIAL%20SOFTWARE/Sistema/Sistema_Veterinario_Integral/frontend/src/App.tsx)) configurados.

Próximo paso sugerido: **Diseño del esquema de base de datos en `schema.prisma`**.
