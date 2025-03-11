// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react'

import { auth } from '@/lib/firebase'
import { authService } from '@/services/auth'
import { User, InviteUserForm, CompleteRegistrationForm } from '@/@types/user'

interface IAuthContextData {
  isAuth: boolean
  user: User | null
  isAuthLoading: boolean
  message: { type: 'success' | 'error'; text: string } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  inviteUser: (data: InviteUserForm) => Promise<void>
  completeRegistration: (
    email: string,
    data: CompleteRegistrationForm
  ) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<IAuthContextData>(
  {} as IAuthContextData
)

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await authService.getUserData(firebaseUser.uid)
        setUser(userData)
        setIsAuth(true)
      } else {
        setUser(null)
        setIsAuth(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const userData = await authService.login(email, password)
      setUser(userData)
      setIsAuth(true)
      setMessage({ type: 'success', text: 'Login realizado com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setIsAuth(false)
    } finally {
      setLoading(false)
    }
  }

  const inviteUser = async (data: InviteUserForm) => {
    setLoading(true)
    try {
      await authService.inviteUser(data)
      setMessage({ type: 'success', text: 'Convite enviado com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const completeRegistration = async (
    email: string,
    data: CompleteRegistrationForm
  ) => {
    setLoading(true)
    try {
      const userData = await authService.completeRegistration(email, data)
      setUser(userData)
      setIsAuth(true)
      setMessage({ type: 'success', text: 'Cadastro concluído com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      await authService.resetPassword(email)
      setMessage({
        type: 'success',
        text: 'Email de redefinição enviado com sucesso!'
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const authContextData: IAuthContextData = useMemo(
    () => ({
      isAuth,
      user,
      isAuthLoading: loading,
      message,
      login,
      logout,
      inviteUser,
      completeRegistration,
      resetPassword
    }),
    [isAuth, user, loading, message]
  )

  return (
    <AuthContext.Provider value={authContextData}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): IAuthContextData {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export { AuthProvider }
