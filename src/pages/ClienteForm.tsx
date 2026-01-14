import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  UserPlus,
  Layers,
  User,
  Network,
  Key,
  Lock,
  FileText,
  Settings,
  Server,
  Beaker,
  Upload,
  X,
  XCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import api from '../services/api'

export default function ClienteForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cargandoPuertos, setCargandoPuertos] = useState(false)

  // Estado del formulario
  const [ambiente, setAmbiente] = useState<'produccion' | 'pruebas'>('produccion')
  const [nit, setNit] = useState('')
  const [nombre, setNombre] = useState('')
  const [nombreComercial, setNombreComercial] = useState('')
  const [apiPort, setApiPort] = useState(8500) // Valor inicial, se actualizará al cargar
  const [firmadorPort, setFirmadorPort] = useState(8313) // Valor inicial, se actualizará al cargar
  const [passwordCertificado, setPasswordCertificado] = useState('')
  const [passwordHacienda, setPasswordHacienda] = useState('')
  const [cloudflareToken, setCloudflareToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [certificado, setCertificado] = useState<File | null>(null)
  const [iniciarServicios, setIniciarServicios] = useState(false)

  // Validación
  const [nitError, setNitError] = useState('')

  useEffect(() => {
    // Cargar puertos iniciales
    cargarPuertosSugeridos()
  }, [])

  useEffect(() => {
    // Actualizar puertos cuando cambia el ambiente
    cargarPuertosSugeridos()
  }, [ambiente])

  const cargarPuertosSugeridos = async () => {
    setCargandoPuertos(true)
    try {
      const response = await api.get(`/clientes/puertos-sugeridos?ambiente=${ambiente}`)
      if (response.data.success) {
        setApiPort(response.data.api_port)
        setFirmadorPort(response.data.firmador_port)
      }
    } catch (error) {
      console.error('Error cargando puertos:', error)
    } finally {
      setCargandoPuertos(false)
    }
  }

  const validarNit = (value: string) => {
    // Solo números, máximo 14 dígitos
    const nitRegex = /^\d{0,14}$/
    if (!nitRegex.test(value)) {
      setNitError('El NIT debe contener solo números (máximo 14 dígitos)')
      return false
    }
    if (value.length !== 14 && value.length > 0) {
      setNitError('El NIT debe tener exactamente 14 dígitos')
      return false
    }
    setNitError('')
    return true
  }

  const handleNitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNit(value)
    validarNit(value)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validar extensión
      if (!file.name.endsWith('.crt') && !file.name.endsWith('.cer')) {
        setError('El archivo debe ser un certificado (.crt o .cer)')
        return
      }
      setCertificado(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!validarNit(nit)) {
      setError('Por favor, corrige el NIT')
      return
    }

    if (nit.length !== 14) {
      setError('El NIT debe tener exactamente 14 dígitos')
      return
    }

    if (!certificado) {
      setError('Debes seleccionar un archivo de certificado')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('nit', nit)
      formData.append('nombre', nombre)
      formData.append('nombre_comercial', nombreComercial)
      formData.append('api_port', apiPort.toString())
      formData.append('firmador_port', firmadorPort.toString())
      formData.append('password_certificado', passwordCertificado)
      formData.append('password_hacienda', passwordHacienda)
      formData.append('cloudflare_token', cloudflareToken)
      formData.append('api_key', apiKey || '')
      formData.append('ambiente', ambiente)
      formData.append('iniciar_servicios', iniciarServicios.toString())
      formData.append('certificado', certificado)

      const response = await api.post('/clientes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      })

      // Si la respuesta es exitosa, navegar
      if (response.data && response.data.success) {
        navigate(`/clientes?ambiente=${ambiente}`)
      } else {
        setError(response.data?.error || 'Error al crear el cliente')
      }
    } catch (error: any) {
      console.error('Error creando cliente:', error)
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('Error al crear el cliente. Por favor, verifica los datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Rangos de puertos según ambiente
  const puertoApiMin = ambiente === 'pruebas' ? 8000 : 8500
  const puertoApiMax = ambiente === 'pruebas' ? 8499 : 8999
  const puertoFirmadorMin = ambiente === 'pruebas' ? 8113 : 8313
  const puertoFirmadorMax = ambiente === 'pruebas' ? 8312 : 8512

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2 flex items-center">
            <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-1.5 sm:mr-2" />
            <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl">Agregar Nuevo Cliente</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Complete el formulario para crear el cliente
          </p>
        </div>
        <Link
          to="/clientes"
          className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:border-blue-500 transition-all transform hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Volver a Clientes
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-3" />
              <span className="text-sm font-medium text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Ambiente */}
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50">
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100">Ambiente</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <label
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                ambiente === 'produccion'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <input
                type="radio"
                name="ambiente"
                value="produccion"
                checked={ambiente === 'produccion'}
                onChange={(e) => {
                  setAmbiente(e.target.value as 'produccion' | 'pruebas')
                  // Los puertos se actualizarán automáticamente por el useEffect
                }}
                className="mr-3 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-100 flex items-center">
                  <Server className="w-4 h-4 mr-2" />
                  Producción
                </div>
                <div className="text-sm text-slate-400">Puertos API: 8500-8999</div>
                <div className="text-sm text-slate-400">Puertos Firmador: 8313-8512</div>
              </div>
            </label>
            <label
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                ambiente === 'pruebas'
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <input
                type="radio"
                name="ambiente"
                value="pruebas"
                checked={ambiente === 'pruebas'}
                onChange={(e) => {
                  setAmbiente(e.target.value as 'produccion' | 'pruebas')
                  // Los puertos se actualizarán automáticamente por el useEffect
                }}
                className="mr-3 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-100 flex items-center">
                  <Beaker className="w-4 h-4 mr-2" />
                  Pruebas
                </div>
                <div className="text-sm text-slate-400">Puertos API: 8000-8499</div>
                <div className="text-sm text-slate-400">Puertos Firmador: 8113-8312</div>
              </div>
            </label>
          </div>
          {cargandoPuertos && (
            <div className="mt-3 flex items-center text-sm text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Actualizando puertos sugeridos...</span>
            </div>
          )}
        </div>

        {/* Información Básica */}
        <div className="card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Información Básica</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* NIT */}
            <div>
              <label htmlFor="nit" className="block text-sm font-medium text-slate-300 mb-2">
                NIT *
              </label>
              <input
                type="text"
                id="nit"
                name="nit"
                required
                pattern="[0-9]{14}"
                maxLength={14}
                value={nit}
                onChange={handleNitChange}
                className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  nitError ? 'border-red-500' : 'border-slate-700'
                }`}
                placeholder="12345678901234"
              />
              {nitError ? (
                <p className="mt-2 text-xs text-red-400">{nitError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">14 dígitos numéricos</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nombre completo del cliente"
              />
            </div>

            {/* Nombre Comercial */}
            <div className="sm:col-span-2">
              <label htmlFor="nombre_comercial" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre Comercial *
              </label>
              <input
                type="text"
                id="nombre_comercial"
                name="nombre_comercial"
                required
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nombre comercial del cliente"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Puertos */}
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <Network className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100">Configuración de Puertos</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            {/* Puerto API */}
            <div>
              <label htmlFor="api_port" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <Network className="w-4 h-4 mr-2" />
                Puerto API *
              </label>
              <input
                type="number"
                id="api_port"
                name="api_port"
                required
                min={puertoApiMin}
                max={puertoApiMax}
                value={apiPort}
                onChange={(e) => setApiPort(parseInt(e.target.value) || puertoApiMin)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-2 text-xs text-slate-500">
                Puerto sugerido:{' '}
                <span className="text-blue-400 font-mono font-semibold">{apiPort}</span>
                <span className="text-slate-600 ml-2">
                  (Rango: {puertoApiMin}-{puertoApiMax})
                </span>
              </p>
            </div>

            {/* Puerto Firmador */}
            <div>
              <label htmlFor="firmador_port" className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Puerto Firmador *
              </label>
              <input
                type="number"
                id="firmador_port"
                name="firmador_port"
                required
                min={puertoFirmadorMin}
                max={puertoFirmadorMax}
                value={firmadorPort}
                onChange={(e) => setFirmadorPort(parseInt(e.target.value) || puertoFirmadorMin)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="mt-2 text-xs text-slate-500">
                Puerto sugerido:{' '}
                <span className="text-indigo-400 font-mono font-semibold">{firmadorPort}</span>
                <span className="text-slate-600 ml-2">
                  (Rango: {puertoFirmadorMin}-{puertoFirmadorMax})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Credenciales */}
        <div className="card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Credenciales</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Password Certificado */}
            <div>
              <label htmlFor="password_certificado" className="block text-sm font-medium text-slate-300 mb-2">
                Password Certificado *
              </label>
              <input
                type="password"
                id="password_certificado"
                name="password_certificado"
                required
                value={passwordCertificado}
                onChange={(e) => setPasswordCertificado(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password Hacienda */}
            <div>
              <label htmlFor="password_hacienda" className="block text-sm font-medium text-slate-300 mb-2">
                Password Hacienda *
              </label>
              <input
                type="password"
                id="password_hacienda"
                name="password_hacienda"
                required
                value={passwordHacienda}
                onChange={(e) => setPasswordHacienda(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Token Cloudflare */}
            <div className="sm:col-span-2">
              <label htmlFor="cloudflare_token" className="block text-sm font-medium text-slate-300 mb-2">
                Token Cloudflare *
              </label>
              <input
                type="text"
                id="cloudflare_token"
                name="cloudflare_token"
                required
                value={cloudflareToken}
                onChange={(e) => setCloudflareToken(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              />
            </div>

            {/* API Key */}
            <div className="sm:col-span-2">
              <label htmlFor="api_key" className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                id="api_key"
                name="api_key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">Se generará automáticamente si se deja vacío</p>
            </div>
          </div>
        </div>

        {/* Certificado Digital */}
        <div className="card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Certificado Digital</h3>
          </div>

          <div>
            <label htmlFor="certificado" className="block text-sm font-medium text-slate-300 mb-2">
              Archivo Certificado (.crt, .cer) *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-xl hover:border-blue-500/50 transition-colors">
              <div className="space-y-1 text-center">
                {certificado ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mb-2" />
                    <p className="text-sm text-slate-300 font-medium">{certificado.name}</p>
                    <button
                      type="button"
                      onClick={() => setCertificado(null)}
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <div className="flex text-sm text-slate-400">
                      <label
                        htmlFor="certificado"
                        className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300"
                      >
                        <span>Seleccionar archivo</span>
                        <input
                          type="file"
                          id="certificado"
                          name="certificado"
                          required
                          accept=".crt,.cer"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-slate-500">Archivo de certificado digital (.crt, .cer)</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="card rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Opciones</h3>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="iniciar_servicios"
              name="iniciar_servicios"
              checked={iniciarServicios}
              onChange={(e) => setIniciarServicios(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-700 rounded bg-slate-900"
            />
            <label htmlFor="iniciar_servicios" className="ml-3 block text-sm text-slate-300">
              Iniciar servicios Docker automáticamente después de crear
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <Link
            to="/clientes"
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:border-blue-500 transition-all transform hover:scale-105 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || cargandoPuertos}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Crear Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
