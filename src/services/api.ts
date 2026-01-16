import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/admin',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 segundos - más agresivo
  // Compresión automática
  decompress: true,
})

// ==================== CACHE SYSTEM ====================
interface CacheEntry {
  data: any
  timestamp: number
  promise?: Promise<any>
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 30000 // 30 segundos para datos estáticos (más agresivo)
const FAST_CACHE_TTL = 5000 // 5 segundos para datos dinámicos

// Endpoints que NO deben cachearse
const NO_CACHE_ENDPOINTS = [
  '/tiempo-real',
  '/logs/stream',
]

// Endpoints con cache corto (datos que cambian frecuentemente)
const FAST_CACHE_ENDPOINTS = [
  '/stats',
  '/alertas',
  '/logs',
]

// ==================== REQUEST DEDUPLICATION ====================
const pendingRequests = new Map<string, Promise<any>>()

// ==================== INTERCEPTORS ====================

// Request interceptor
api.interceptors.request.use((config) => {
  // No agregar timestamp a POST/PUT/DELETE
  if (config.method === 'get') {
    if (!config.params) config.params = {}
    // Timestamp más corto para reducir tamaño de URL
    config.params._t = Date.now().toString(36)
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.warn('Session expired')
    }
    return Promise.reject(error)
  }
)

// ==================== OPTIMIZED GET ====================

export const getCached = async <T = any>(
  url: string, 
  options: { 
    forceRefresh?: boolean
    ttl?: number 
  } = {}
): Promise<{ data: T }> => {
  const { forceRefresh = false, ttl } = options
  
  // Determinar TTL basado en el endpoint
  const shouldNotCache = NO_CACHE_ENDPOINTS.some(ep => url.includes(ep))
  if (shouldNotCache) {
    return api.get<T>(url)
  }
  
  const isFastCache = FAST_CACHE_ENDPOINTS.some(ep => url.includes(ep))
  const cacheTTL = ttl ?? (isFastCache ? FAST_CACHE_TTL : CACHE_TTL)
  
  // Verificar cache
  const cached = cache.get(url)
  if (!forceRefresh && cached && Date.now() - cached.timestamp < cacheTTL) {
    return { data: cached.data }
  }
  
  // Request deduplication - si ya hay una request pendiente, esperar esa
  const existingRequest = pendingRequests.get(url)
  if (existingRequest) {
    return existingRequest
  }
  
  // Crear nueva request
  const requestPromise = api.get<T>(url).then(response => {
    // Guardar en cache
    cache.set(url, {
      data: response.data,
      timestamp: Date.now(),
    })
    // Limpiar request pendiente
    pendingRequests.delete(url)
    return response
  }).catch(error => {
    pendingRequests.delete(url)
    throw error
  })
  
  // Guardar request pendiente
  pendingRequests.set(url, requestPromise)
  
  return requestPromise
}

// ==================== BATCH REQUESTS ====================

export const batchGet = async <T = any>(
  urls: string[]
): Promise<{ data: T }[]> => {
  return Promise.all(urls.map(url => getCached<T>(url)))
}

// ==================== PREFETCH ====================

export const prefetch = (url: string): void => {
  getCached(url).catch(() => {
    // Silently ignore prefetch errors
  })
}

// ==================== CACHE MANAGEMENT ====================

export const clearCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

export const invalidateCache = (url: string): void => {
  cache.delete(url)
}

// ==================== STALE-WHILE-REVALIDATE ====================

export const getSWR = async <T = any>(
  url: string,
  onData: (data: T, isStale: boolean) => void
): Promise<void> => {
  const cached = cache.get(url)
  
  // Retornar datos stale inmediatamente si existen
  if (cached) {
    onData(cached.data, true)
  }
  
  // Revalidar en background
  try {
    const response = await getCached<T>(url, { forceRefresh: true })
    onData(response.data, false)
  } catch (error) {
    // Si hay error y no hay cache, propagar
    if (!cached) throw error
  }
}

export default api
