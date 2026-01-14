# DTE Admin Frontend

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

## Configuración

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus configuraciones:
```env
VITE_API_BASE_URL=/admin
VITE_API_URL=http://localhost:8003
VITE_PORT=5173
VITE_API_TIMEOUT=60000
```

## Desarrollo

El servidor de desarrollo corre en el puerto configurado (por defecto `5173`) y se conecta al backend mediante proxy configurado en `vite.config.ts`.

