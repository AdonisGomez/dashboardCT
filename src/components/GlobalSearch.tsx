import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, FileText, Users, Bell, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface SearchResult {
  type: 'cliente' | 'dte' | 'alerta'
  id: string
  title: string
  subtitle: string
  metadata?: string
}

interface SearchHistory {
  query: string
  timestamp: number
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Cargar historial desde localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Error loading search history:', e)
      }
    }
  }, [])

  // Atajo de teclado Ctrl+K - manejado en Header
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        setQuery('')
        setResults([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Búsqueda con debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.data.success) {
        setResults(response.data.results || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    // Guardar en historial
    const newHistory: SearchHistory = {
      query: searchQuery,
      timestamp: Date.now(),
    }
    const updatedHistory = [
      newHistory,
      ...history.filter((h) => h.query !== searchQuery),
    ].slice(0, 10) // Máximo 10 búsquedas
    setHistory(updatedHistory)
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory))

    // Realizar búsqueda
    performSearch(searchQuery)
  }

  const handleResultClick = (result: SearchResult) => {
    // Guardar búsqueda en historial
    if (query.trim()) {
      handleSearch(query)
    }

    // Navegar según el tipo
    if (result.type === 'cliente') {
      navigate(`/clientes/${result.id}`)
    } else if (result.type === 'dte') {
      // Abrir modal de detalles (se implementará después)
      navigate(`/dte?codigo=${result.id}`)
    } else if (result.type === 'alerta') {
      navigate('/alertas')
    }

    onClose()
    setQuery('')
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault()
      handleResultClick(results[selectedIndex])
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('searchHistory')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32 px-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal de búsqueda */}
      <div className="relative w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        {/* Input de búsqueda */}
        <div className="flex items-center px-4 py-3 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && query.trim() && results.length === 0) {
                handleSearch(query)
              }
            }}
            placeholder="Buscar clientes, DTE, alertas..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-sm sm:text-base"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults([])
                setSelectedIndex(-1)
              }}
              className="ml-2 p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Resultados o historial */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="ml-2 text-slate-400">Buscando...</span>
            </div>
          ) : query.trim() && results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`w-full flex items-start px-4 py-3 hover:bg-slate-700/50 transition-colors ${
                    selectedIndex === index ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {result.type === 'cliente' ? (
                      <Users className="w-5 h-5 text-blue-400" />
                    ) : result.type === 'dte' ? (
                      <FileText className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {result.title}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{result.subtitle}</div>
                    {result.metadata && (
                      <div className="text-xs text-slate-500 mt-1">{result.metadata}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-400">No se encontraron resultados</p>
              <p className="text-xs text-slate-500 mt-1">Intenta con otros términos</p>
            </div>
          ) : (
            <div className="py-2">
              {history.length > 0 && (
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center text-xs text-slate-400">
                    <Clock className="w-4 h-4 mr-2" />
                    Búsquedas recientes
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Limpiar
                  </button>
                </div>
              )}
              {history.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(item.query)
                    handleSearch(item.query)
                  }}
                  className="w-full flex items-center px-4 py-2 hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-slate-500 mr-3 flex-shrink-0" />
                  <span className="text-sm text-slate-300 flex-1 truncate">{item.query}</span>
                </button>
              ))}
              {history.length === 0 && (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Comienza a buscar...</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl+K</kbd> para
                    buscar rápidamente
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con atajos */}
        <div className="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded mr-1">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded mr-1">Enter</kbd>
              Seleccionar
            </span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded mr-1">Esc</kbd>
              Cerrar
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

