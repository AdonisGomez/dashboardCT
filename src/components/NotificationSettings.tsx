import { useState } from 'react'
import { Bell, Volume2, VolumeX, AlertTriangle, X } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { preferences, permission, updatePreferences } = useNotifications()
  const [localPrefs, setLocalPrefs] = useState(preferences)

  if (!isOpen) return null

  const handleSave = () => {
    updatePreferences(localPrefs)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">Configuración de Notificaciones</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Notificaciones Push */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">Notificaciones Push</p>
                <p className="text-xs text-slate-400">
                  {permission === 'granted'
                    ? 'Permiso concedido'
                    : permission === 'denied'
                    ? 'Permiso denegado'
                    : 'Solicitar permiso'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.pushEnabled}
                onChange={(e) =>
                  setLocalPrefs({ ...localPrefs, pushEnabled: e.target.checked })
                }
                disabled={permission === 'denied'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Sonidos */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              {localPrefs.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-100">Sonidos de Alerta</p>
                <p className="text-xs text-slate-400">Reproducir sonido para alertas críticas</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.soundEnabled}
                onChange={(e) =>
                  setLocalPrefs({ ...localPrefs, soundEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Solo Críticas */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">Solo Alertas Críticas</p>
                <p className="text-xs text-slate-400">Notificar solo alertas de alta severidad</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPrefs.criticalOnly}
                onChange={(e) =>
                  setLocalPrefs({ ...localPrefs, criticalOnly: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Botones */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

