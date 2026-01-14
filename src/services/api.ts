import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/admin' : '/admin',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Optimizaciones de rendimiento
  timeout: 60000, // 60 segundos timeout (aumentado para conexiones móviles lentas)
})

// Cache simple para respuestas GET (solo para datos que no cambian frecuentemente)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5000 // 5 segundos

// Interceptor de request: agregar timestamp para evitar cache del navegador
api.interceptors.request.use((config) => {
  if (config.method === 'get' && !config.params) {
    config.params = {}
  }
  if (config.method === 'get' && config.params) {
    config.params._t = Date.now()
  }
  return config
})

// Interceptor de response: cachear respuestas GET exitosas
api.interceptors.response.use(
  (response) => {
    // Cachear respuestas GET exitosas (solo para ciertos endpoints)
    if (response.config.method === 'get') {
      const url = response.config.url || ''
      // No cachear endpoints que cambian frecuentemente
      if (!url.includes('/stats') && !url.includes('/tiempo-real') && !url.includes('/logs') && !url.includes('/alertas/api')) {
        cache.set(url, {
          data: response.data,
          timestamp: Date.now(),
        })
      }
    }
    return response
  },
  (error) => {
    // Manejar errores
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.warn('Unauthorized request, session may have expired')
    }
    return Promise.reject(error)
  }
)

// Función helper para obtener datos con cache
export const getCached = async (url: string, forceRefresh = false) => {
  const cached = cache.get(url)
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: cached.data }
  }
  return api.get(url)
}

export default api

