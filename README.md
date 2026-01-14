# Cuskatech Admin Frontend

Frontend moderno construido con React + Vite + TypeScript para la interfaz de administración DTE.

## Stack Tecnológico

- **React 18** - Biblioteca UI moderna
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultra rápido
- **React Router** - Routing del lado del cliente
- **Zustand** - State management ligero
- **TailwindCSS** - Framework CSS utility-first
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos modernos

## Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas/views
├── services/      # Servicios API
├── stores/        # Zustand stores
├── types/         # TypeScript types
└── utils/         # Utilidades
```

## Desarrollo

El servidor de desarrollo corre en `http://localhost:5173` y se conecta al backend FastAPI en `http://localhost:8003` mediante proxy.

