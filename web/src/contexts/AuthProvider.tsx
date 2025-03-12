// src/contexts/AuthProvider.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react'
import { auth } from '@/lib/firebase'
import { authService } from '@/services/auth'
import { User, FirstAccessForm, UserType, UserRole } from '@/@types/user'

// Função para converter User em UserType
const convertToUserType = (user: User): UserType => {
  switch (user.role) {
    case UserRole.ADMINISTRADOR_GERAL:
      return { ...user, role: UserRole.ADMINISTRADOR_GERAL } as UserType
    case UserRole.ADMINISTRADOR_CIDADE:
      return { ...user, role: UserRole.ADMINISTRADOR_CIDADE } as UserType
    case UserRole.PREFEITO:
      return { ...user, role: UserRole.PREFEITO } as UserType
    case UserRole.VEREADOR:
      return { ...user, role: UserRole.VEREADOR } as UserType
    case UserRole.CABO_ELEITORAL:
      return { ...user, role: UserRole.CABO_ELEITORAL } as UserType
    case UserRole.ELEITOR:
      return { ...user, role: UserRole.ELEITOR } as UserType
    case UserRole.PENDENTE:
      return { ...user, role: UserRole.PENDENTE, profile: null } as UserType
    default:
      throw new Error('Papel de usuário desconhecido')
  }
}

interface IAuthContextData {
  isAuth: boolean
  user: UserType | null
  isAuthLoading: boolean
  message: { type: 'success' | 'error'; text: string } | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  inviteUser: (
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ) => Promise<void>
  completeRegistration: (email: string, data: FirstAccessForm) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<IAuthContextData>(
  {} as IAuthContextData
)

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean>(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await authService.getUserData(firebaseUser.uid)
        setUser(userData ? convertToUserType(userData) : null)
        setIsAuth(!!userData && !userData?.access?.isFirstAccess)
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
      setUser(convertToUserType(userData))
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

  const inviteUser = async (
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ) => {
    setLoading(true)
    try {
      await authService.inviteUser(email, role, cityId)
      setMessage({ type: 'success', text: 'Convite enviado com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const completeRegistration = async (email: string, data: FirstAccessForm) => {
    setLoading(true)
    try {
      const userData = await authService.completeRegistration(email, data)
      setUser(convertToUserType(userData))
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
