import { useEffect, useState, useRef } from 'react'
import api from '../services/api'

interface NotificationPreferences {
  pushEnabled: boolean
  soundEnabled: boolean
  criticalOnly: boolean
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  soundEnabled: true,
  criticalOnly: false,
}

// Sonido de alerta crítica
const playAlertSound = () => {
  try {
    // Crear audio context para generar sonido
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.error('Error playing alert sound:', error)
  }
}

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [lastAlertCount, setLastAlertCount] = useState(0)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cargar preferencias desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading notification preferences:', e)
      }
    }
  }, [])

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if ('Notification' in window && preferences.pushEnabled) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setPermission(perm)
        })
      } else {
        setPermission(Notification.permission)
      }
    }
  }, [preferences.pushEnabled])

  // Monitorear alertas
  useEffect(() => {
    if (!preferences.pushEnabled && !preferences.soundEnabled) {
      return
    }

    const checkAlerts = async () => {
      try {
        // Usar timeout más largo para alertas
        const response = await api.get('/alertas/api', { timeout: 20000 })
        if (response.data.success) {
          const alertas = response.data.alertas || []
          
          // Filtrar por severidad si es necesario
          const alertasFiltradas = preferences.criticalOnly
            ? alertas.filter((a: any) => a.severidad === 'critica' || a.severidad === 'alta')
            : alertas

          const currentCount = alertasFiltradas.length

          // Si hay nuevas alertas
          if (currentCount > lastAlertCount) {
            const nuevasAlertas = alertasFiltradas.slice(0, currentCount - lastAlertCount)

            // Notificaciones push
            if (preferences.pushEnabled && permission === 'granted') {
              nuevasAlertas.forEach((alerta: any) => {
                new Notification(`Alerta: ${alerta.tipo.replace(/_/g, ' ')}`, {
                  body: alerta.mensaje,
                  icon: '/favicon.ico',
                  tag: `alerta-${alerta.id || Date.now()}`,
                  requireInteraction: alerta.severidad === 'critica',
                })
              })
            }

            // Sonido para alertas críticas
            if (preferences.soundEnabled) {
              const hayCriticas = nuevasAlertas.some((a: any) => a.severidad === 'critica' || a.severidad === 'alta')
              if (hayCriticas) {
                playAlertSound()
              }
            }
          }

          setLastAlertCount(currentCount)
        }
      } catch (error: any) {
        // Solo loggear errores que no sean timeout o de conexión
        if (error.code !== 'ECONNABORTED' && error.message !== 'timeout of 20000ms exceeded') {
          console.error('Error checking alerts:', error)
        }
        // Silenciar timeouts - es normal si el servidor está ocupado
      }
    }

    // Verificar cada 30 segundos
    intervalRef.current = setInterval(checkAlerts, 30000)
    checkAlerts() // Verificar inmediatamente

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [preferences, permission, lastAlertCount])

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    localStorage.setItem('notificationPreferences', JSON.stringify(updated))

    // Si se habilita push, solicitar permiso
    if (newPreferences.pushEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setPermission(perm)
        })
      }
    }
  }

  return {
    preferences,
    permission,
    updatePreferences,
  }
}

