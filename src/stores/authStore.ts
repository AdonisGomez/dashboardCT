import { create } from 'zustand'
import api from '../services/api'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  email: string | null
  role: 'admin' | 'viewer' | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  canWrite: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  username: null,
  email: null,
  role: null,
  
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/login/api', {
        username,
        password,
      })
      
      if (response.data.success) {
        // Establecer estado inmediatamente después del login exitoso
        set({
          isAuthenticated: true,
          username: response.data.username || username,
          email: response.data.email || null,
          role: response.data.role || 'admin',
        })
        
        // Esperar un momento para que la cookie se establezca antes de verificar
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Verificar que la sesión esté activa (opcional, pero ayuda a confirmar)
        try {
          const { checkAuth } = get()
          await checkAuth()
        } catch (error) {
          // Si falla la verificación, mantener el estado autenticado
          // ya que el login fue exitoso
          console.warn('Session verification failed after login, but login was successful')
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  },
  
  logout: async () => {
    try {
      await api.post('/logout/api')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({
        isAuthenticated: false,
        username: null,
        email: null,
        role: null,
      })
    }
  },
  
  checkAuth: async () => {
    try {
      const response = await api.get('/me')
      if (response.data.authenticated) {
        set({
          isAuthenticated: true,
          username: response.data.username,
          email: response.data.email || null,
          role: response.data.role || 'admin',
        })
      } else {
        set({
          isAuthenticated: false,
          username: null,
          email: null,
          role: null,
        })
      }
    } catch (error: any) {
      // Si es 401, la sesión expiró o no hay sesión
      if (error.response?.status === 401) {
        set({
          isAuthenticated: false,
          username: null,
          email: null,
          role: null,
        })
      } else {
        // Otro error, mantener el estado actual
        console.error('Error checking auth:', error)
      }
    }
  },
  
  canWrite: () => {
    const { role } = get()
    return role === 'admin'
  },
}))

