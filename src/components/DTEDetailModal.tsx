import { useState, useEffect } from 'react'
import { X, FileText, Calendar, CheckCircle, XCircle, Clock, RefreshCw, Download, Copy } from 'lucide-react'
import api from '../services/api'

interface DTEDetail {
  _id?: string
  cliente_id: string
  codigo_generacion: string
  numero_control?: string
  tipo_dte: string
  ambiente: string
  estado: string
  dte_original?: any
  dte_firmado_jws?: string
  respuesta_hacienda?: any
  fecha_creacion?: string
  fecha_firma?: string
  fecha_envio?: string
  fecha_respuesta?: string
  intentos?: number
  max_intentos?: number
  errores?: string[]
  ultimo_error?: string
  total_documento?: number
  total_iva?: number
  cantidad_items?: number
  en_cola_reintentos?: boolean
  proximo_reintento?: string
}

interface DTEDetailModalProps {
  codigoGeneracion: string
  isOpen: boolean
  onClose: () => void
}

const tipoDTENombres: Record<string, string> = {
  '01': 'Factura',
  '03': 'CCF (Comprobante de Crédito Fiscal)',
  '04': 'Nota de Débito',
  '05': 'Nota de Crédito',
  '06': 'Registro de Factura',
  '07': 'Factura de Exportación',
  '08': 'Comprobante de Retención',
  '09': 'Comprobante de Liquidación',
  '10': 'Documento Contable de Liquidación',
  '11': 'Documento de Anulación',
  '12': 'Comprobante de Donación',
  '13': 'Sujeto Excluido',
  '14': 'Nota de Remisión',
}

export default function DTEDetailModal({ codigoGeneracion, isOpen, onClose }: DTEDetailModalProps) {
  const [dte, setDte] = useState<DTEDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'xml' | 'json' | 'history'>('info')

  useEffect(() => {
    if (isOpen && codigoGeneracion) {
      loadDTEDetails()
    }
  }, [isOpen, codigoGeneracion])

  const loadDTEDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/dte/detalle/${codigoGeneracion}`)
      if (response.data.success) {
        setDte(response.data.dte)
      }
    } catch (error) {
      console.error('Error loading DTE details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      // Las fechas vienen sin timezone desde MongoDB (naive datetime)
      // Asumimos que están en hora de Centroamérica (GMT-6)
      // Si la fecha no tiene timezone, agregamos -06:00
      let date: Date
      if (dateStr.includes('+') || dateStr.includes('Z') || (dateStr.includes('-') && dateStr.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/))) {
        // Ya tiene timezone
        date = new Date(dateStr)
      } else {
        // No tiene timezone, asumir que es hora de Centroamérica (GMT-6)
        // Formato esperado: "2026-01-06 23:37:01" o "2026-01-06T23:37:01"
        const normalized = dateStr.replace(' ', 'T')
        // Agregar offset -06:00 para hora de Centroamérica
        date = new Date(normalized + '-06:00')
      }
      
      // Convertir a hora local de Centroamérica para mostrar
      return date.toLocaleString('es-ES', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'aceptado':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'rechazado':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'enviado':
      case 'firmado':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pendiente':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aceptado':
        return <CheckCircle className="w-4 h-4" />
      case 'rechazado':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Opcional: mostrar notificación de copiado
  }

  const extraerMensajeDetalladoHacienda = (respuestaHacienda: any): string | null => {
    if (!respuestaHacienda || typeof respuestaHacienda !== 'object') {
      return null
    }

    // Campos posibles donde Hacienda puede poner el mensaje de error
    const camposPosibles = [
      'descripcionMsg',
      'descripcion',
      'mensaje',
      'message',
      'error',
      'errorMessage',
      'detalle',
      'detail',
      'razon',
      'razonRechazo',
      'motivo',
      'motivoRechazo'
    ]

    // Buscar en campos directos
    for (const campo of camposPosibles) {
      const valor = respuestaHacienda[campo]
      if (valor) {
        if (typeof valor === 'string' && valor.trim()) {
          return valor.trim()
        }
        if (typeof valor === 'object' && valor !== null) {
          // Buscar dentro del objeto
          for (const subCampo of camposPosibles) {
            if (valor[subCampo] && typeof valor[subCampo] === 'string' && valor[subCampo].trim()) {
              return valor[subCampo].trim()
            }
          }
        }
      }
    }

    // Buscar en arrays de errores
    if (Array.isArray(respuestaHacienda.errores) && respuestaHacienda.errores.length > 0) {
      const primerError = respuestaHacienda.errores[0]
      if (typeof primerError === 'string') {
        return primerError
      }
      if (typeof primerError === 'object' && primerError !== null) {
        for (const campo of camposPosibles) {
          if (primerError[campo] && typeof primerError[campo] === 'string' && primerError[campo].trim()) {
            return primerError[campo].trim()
          }
        }
      }
    }

    return null
  }

  const obtenerErroresDetallados = (): Array<{ tipo: 'detallado' | 'generico', mensaje: string }> => {
    const errores: Array<{ tipo: 'detallado' | 'generico', mensaje: string }> = []

    // Primero intentar extraer de respuesta_hacienda
    if (dte?.respuesta_hacienda) {
      const mensajeDetallado = extraerMensajeDetalladoHacienda(dte.respuesta_hacienda)
      if (mensajeDetallado) {
        errores.push({ tipo: 'detallado', mensaje: mensajeDetallado })
      }
    }

    // Luego agregar errores de la lista (si no están duplicados)
    if (dte?.errores && Array.isArray(dte.errores)) {
      dte.errores.forEach((error: string) => {
        // Evitar duplicados
        if (!errores.some(e => e.mensaje === error)) {
          errores.push({ tipo: 'generico', mensaje: error })
        }
      })
    }

    // Si no hay errores pero hay ultimo_error, agregarlo
    if (errores.length === 0 && dte?.ultimo_error) {
      errores.push({ tipo: 'generico', mensaje: dte.ultimo_error })
    }

    return errores
  }

  const downloadJSON = () => {
    if (!dte) return
    const dataStr = JSON.stringify(dte, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dte-${dte.codigo_generacion}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-800 rounded-xl border border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Detalles del DTE
              </h2>
              {dte && (
                <p className="text-xs sm:text-sm text-slate-400 font-mono">
                  {dte.codigo_generacion}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <span className="ml-3 text-slate-400">Cargando detalles...</span>
            </div>
          ) : dte ? (
            <>
              {/* Tabs */}
              <div className="flex items-center border-b border-slate-700 px-4 sm:px-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Información
                </button>
                <button
                  onClick={() => setActiveTab('xml')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'xml'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  XML Original
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'json'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  JSON Completo
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Historial
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    {/* Estado */}
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-300">Estado</h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getEstadoColor(
                            dte.estado
                          )}`}
                        >
                          {getEstadoIcon(dte.estado)}
                          <span className="ml-1.5">{dte.estado.toUpperCase()}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Tipo DTE:</span>
                          <span className="ml-2 text-slate-100">
                            {tipoDTENombres[dte.tipo_dte] || dte.tipo_dte}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Ambiente:</span>
                          <span className="ml-2 text-slate-100">
                            {dte.ambiente === '01' ? 'PRODUCCIÓN' : 'PRUEBAS'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Cliente:</span>
                          <span className="ml-2 text-slate-100 font-mono">{dte.cliente_id}</span>
                        </div>
                        {dte.numero_control && (
                          <div>
                            <span className="text-slate-400">Número Control:</span>
                            <span className="ml-2 text-slate-100 font-mono">{dte.numero_control}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-300 mb-3">Fechas</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-slate-400">Creación:</span>
                          <span className="ml-2 text-slate-100">{formatDate(dte.fecha_creacion)}</span>
                        </div>
                        {dte.fecha_firma && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-slate-400">Firma:</span>
                            <span className="ml-2 text-slate-100">{formatDate(dte.fecha_firma)}</span>
                          </div>
                        )}
                        {dte.fecha_envio && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-slate-400">Envío:</span>
                            <span className="ml-2 text-slate-100">{formatDate(dte.fecha_envio)}</span>
                          </div>
                        )}
                        {dte.fecha_respuesta && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-slate-400">Respuesta:</span>
                            <span className="ml-2 text-slate-100">{formatDate(dte.fecha_respuesta)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reintentos */}
                    {(dte.intentos || dte.en_cola_reintentos) && (
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Reintentos</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-400">Intentos:</span>
                            <span className="ml-2 text-slate-100">
                              {dte.intentos || 0} / {dte.max_intentos || 3}
                            </span>
                          </div>
                          {dte.en_cola_reintentos && (
                            <div>
                              <span className="text-slate-400">En cola de reintentos:</span>
                              <span className="ml-2 text-amber-400">Sí</span>
                            </div>
                          )}
                          {dte.proximo_reintento && (
                            <div>
                              <span className="text-slate-400">Próximo reintento:</span>
                              <span className="ml-2 text-slate-100">{formatDate(dte.proximo_reintento)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Totales */}
                    {(dte.total_documento || dte.total_iva) && (
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Totales</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {dte.total_documento && (
                            <div>
                              <span className="text-slate-400">Total Documento:</span>
                              <span className="ml-2 text-slate-100 font-semibold">
                                ${dte.total_documento.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {dte.total_iva && (
                            <div>
                              <span className="text-slate-400">Total IVA:</span>
                              <span className="ml-2 text-slate-100 font-semibold">
                                ${dte.total_iva.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {dte.cantidad_items && (
                            <div>
                              <span className="text-slate-400">Items:</span>
                              <span className="ml-2 text-slate-100">{dte.cantidad_items}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Errores - Mostrar siempre si el estado es rechazado o si hay errores */}
                    {(dte?.estado === 'rechazado' || (dte?.errores && dte.errores.length > 0) || dte?.ultimo_error || dte?.respuesta_hacienda) && (() => {
                      const erroresDetallados = obtenerErroresDetallados()
                      
                      // Si no hay errores pero el estado es rechazado y hay respuesta_hacienda, intentar extraer
                      if (erroresDetallados.length === 0 && dte?.estado === 'rechazado' && dte?.respuesta_hacienda) {
                        const mensajeExtraido = extraerMensajeDetalladoHacienda(dte.respuesta_hacienda)
                        if (mensajeExtraido) {
                          erroresDetallados.push({ tipo: 'detallado', mensaje: mensajeExtraido })
                        }
                      }
                      
                      // Si aún no hay errores pero el estado es rechazado, mostrar mensaje genérico
                      if (erroresDetallados.length === 0 && dte?.estado === 'rechazado') {
                        erroresDetallados.push({ tipo: 'generico', mensaje: 'DTE rechazado por Hacienda' })
                      }
                      
                      if (erroresDetallados.length > 0) {
                        return (
                          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
                              <XCircle className="w-4 h-4 mr-2" />
                              Errores de Hacienda
                            </h3>
                            <div className="space-y-3">
                              {erroresDetallados.map((errorItem, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-lg border ${
                                    errorItem.tipo === 'detallado'
                                      ? 'bg-red-600/20 border-red-500/50'
                                      : 'bg-red-500/10 border-red-500/30'
                                  }`}
                                >
                                  {errorItem.tipo === 'detallado' && (
                                    <div className="flex items-center mb-1">
                                      <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                                        Mensaje Detallado de Hacienda:
                                      </span>
                                    </div>
                                  )}
                                  <p className={`text-sm ${
                                    errorItem.tipo === 'detallado'
                                      ? 'text-red-200 font-medium'
                                      : 'text-red-300'
                                  } break-words`}>
                                    {errorItem.mensaje}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {dte?.respuesta_hacienda && (
                              <details className="mt-3">
                                <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                                  Ver respuesta completa de Hacienda
                                </summary>
                                <pre className="mt-2 p-2 bg-slate-900/50 rounded text-[10px] text-slate-300 overflow-x-auto max-h-40 overflow-y-auto">
                                  {JSON.stringify(dte.respuesta_hacienda, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}

                {activeTab === 'xml' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-300">XML Original del DTE</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(dte.dte_original, null, 2))}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto text-xs text-slate-300">
                      {JSON.stringify(dte.dte_original, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'json' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-300">JSON Completo</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={downloadJSON}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Descargar JSON"
                        >
                          <Download className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(dte, null, 2))}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-lg border border-slate-700 overflow-x-auto text-xs text-slate-300">
                      {JSON.stringify(dte, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300">Historial de Estados</h3>
                    <div className="space-y-3">
                      {dte.fecha_creacion && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                              <span className="text-sm text-slate-300">Creado</span>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(dte.fecha_creacion)}</span>
                          </div>
                        </div>
                      )}
                      {dte.fecha_firma && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3" />
                              <span className="text-sm text-slate-300">Firmado</span>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(dte.fecha_firma)}</span>
                          </div>
                        </div>
                      )}
                      {dte.fecha_envio && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
                              <span className="text-sm text-slate-300">Enviado a Hacienda</span>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(dte.fecha_envio)}</span>
                          </div>
                        </div>
                      )}
                      {dte.fecha_respuesta && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full mr-3 ${
                                  dte.estado === 'aceptado' ? 'bg-emerald-400' : 'bg-red-400'
                                }`}
                              />
                              <span className="text-sm text-slate-300">
                                {dte.estado === 'aceptado' ? 'Aceptado' : 'Rechazado'} por Hacienda
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(dte.fecha_respuesta)}</span>
                          </div>
                          {dte.respuesta_hacienda && (
                            <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-slate-400">
                              {JSON.stringify(dte.respuesta_hacienda, null, 2)}
                            </div>
                          )}
                        </div>
                      )}
                      {dte.intentos && dte.intentos > 1 && (
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <RefreshCw className="w-4 h-4 text-amber-400 mr-3" />
                              <span className="text-sm text-amber-400">
                                {dte.intentos - 1} reintento{dte.intentos > 2 ? 's' : ''} realizado
                                {dte.intentos > 2 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-400">No se pudo cargar la información del DTE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

