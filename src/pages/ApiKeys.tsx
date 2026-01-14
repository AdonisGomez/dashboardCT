import { useEffect, useState } from 'react'
import { Key, RefreshCw, RotateCw, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react'
import api from '../services/api'

interface ApiKey {
  nit: string
  cliente_id: string
  api_key: string
  api_key_masked: string
  ambiente: string
  nombre: string
  nombre_comercial: string
  fecha_creacion: string
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAmbiente, setFiltroAmbiente] = useState<string>('todos')
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [filtroAmbiente])

  const loadApiKeys = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroAmbiente !== 'todos') {
        params.append('ambiente', filtroAmbiente)
      }

      const response = await api.get(`/api-keys/api?${params.toString()}`)
      if (response.data.success) {
        setApiKeys(response.data.api_keys || [])
      }
    } catch (error) {
      console.error('Error cargando API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReveal = (nit: string, ambiente: string) => {
    const key = `${nit}-${ambiente}`
    const newRevealed = new Set(revealedKeys)
    if (newRevealed.has(key)) {
      newRevealed.delete(key)
    } else {
      newRevealed.add(key)
    }
    setRevealedKeys(newRevealed)
  }

  const copyToClipboard = async (text: string, nit: string, ambiente: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(`${nit}-${ambiente}`)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (error) {
      console.error('Error copiando:', error)
    }
  }

  const regenerarApiKey = async (nit: string, ambiente: string) => {
    if (!confirm(`¿Estás seguro de regenerar la API key para ${nit}? Esto invalidará la clave actual.`)) {
      return
    }

    setRegenerating(`${nit}-${ambiente}`)
    try {
      const formData = new FormData()
      formData.append('ambiente', ambiente)

      const response = await api.post(`/api-keys/${nit}/regenerar`, formData)
      if (response.data.success) {
        await loadApiKeys()
        // Revelar la nueva key
        const key = `${nit}-${ambiente}`
        setRevealedKeys(new Set([...revealedKeys, key]))
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || error.message}`)
    } finally {
      setRegenerating(null)
    }
  }

  const filteredKeys = apiKeys.filter(key => {
    if (filtroAmbiente === 'todos') return true
    return key.ambiente === filtroAmbiente
  })

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-2 gradient-text">
            API Keys Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Gestión y auditoría de API keys
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filtroAmbiente}
            onChange={(e) => setFiltroAmbiente(e.target.value)}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="todos">Todos los ambientes</option>
            <option value="produccion">Producción</option>
            <option value="pruebas">Pruebas</option>
          </select>
          <button
            onClick={loadApiKeys}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Total API Keys</div>
          <div className="text-lg sm:text-2xl font-bold text-slate-100">{filteredKeys.length}</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Producción</div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-400">
            {filteredKeys.filter(k => k.ambiente === 'produccion').length}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Pruebas</div>
          <div className="text-lg sm:text-2xl font-bold text-amber-400">
            {filteredKeys.filter(k => k.ambiente === 'pruebas').length}
          </div>
        </div>
      </div>

      {/* Lista de API Keys */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300">API Keys</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Cargando API keys...</div>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400 text-center">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron API keys</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400">Cliente</th>
                  <th className="px-4 py-3 text-left text-slate-400">NIT</th>
                  <th className="px-4 py-3 text-left text-slate-400">Ambiente</th>
                  <th className="px-4 py-3 text-left text-slate-400">API Key</th>
                  <th className="px-4 py-3 text-left text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredKeys.map((key) => {
                  const keyId = `${key.nit}-${key.ambiente}`
                  const isRevealed = revealedKeys.has(keyId)
                  const isCopied = copiedKey === keyId
                  const isRegenerating = regenerating === keyId
                  const displayKey = isRevealed ? key.api_key : key.api_key_masked

                  return (
                    <tr key={keyId} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-medium">{key.nombre_comercial || key.nombre}</div>
                        {key.nombre_comercial && (
                          <div className="text-xs text-slate-400">{key.nombre}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300 font-mono text-xs">{key.nit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          key.ambiente === 'produccion' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {key.ambiente}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-200 font-mono text-xs">{displayKey}</span>
                          <button
                            onClick={() => toggleReveal(key.nit, key.ambiente)}
                            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                            title={isRevealed ? 'Ocultar' : 'Mostrar'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-4 h-4 text-slate-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          {isRevealed && (
                            <button
                              onClick={() => copyToClipboard(key.api_key, key.nit, key.ambiente)}
                              className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                              title="Copiar"
                            >
                              {isCopied ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => regenerarApiKey(key.nit, key.ambiente)}
                          disabled={isRegenerating}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                        >
                          <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                          {isRegenerating ? 'Regenerando...' : 'Regenerar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

