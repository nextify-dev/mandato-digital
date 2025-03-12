// src/contexts/AuthProvider.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react'
import { message } from 'antd'
import { auth } from '@/lib/firebase'
import { authService, FirstAccessEligibility } from '@/services/auth'
import { User, FirstAccessForm, UserType, UserRole } from '@/@types/user'

interface IAuthContextData {
  isAuth: boolean
  user: UserType | null
  isAuthLoading: boolean
  isFirstAccess: boolean
  isFirstAccessEligible: boolean
  emailLocked: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  inviteUser: (
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ) => Promise<void>
  completeRegistration: (email: string, data: FirstAccessForm) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  checkFirstAccess: (email: string) => Promise<void>
  setFirstAccess: (value: boolean) => void
  prefillFirstAccessData: (data?: User) => void
}

export const AuthContext = createContext<IAuthContextData>(
  {} as IAuthContextData
)

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

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage()

  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const [isFirstAccessEligible, setIsFirstAccessEligible] = useState(false)
  const [emailLocked, setEmailLocked] = useState(false)
  const [firstAccessData, setFirstAccessData] = useState<User | undefined>(
    undefined
  )

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
      setIsAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsAuthLoading(true)
    try {
      const userData = await authService.login(email, password)
      setUser(convertToUserType(userData))
      setIsAuth(true)
      messageApi.success('Login realizado com sucesso!')
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }

  const logout = async () => {
    setIsAuthLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setIsAuth(false)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const inviteUser = async (
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ) => {
    setIsAuthLoading(true)
    try {
      await authService.inviteUser(email, role, cityId)
      messageApi.success('Convite enviado com sucesso!')
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }

  const completeRegistration = async (email: string, data: FirstAccessForm) => {
    setIsAuthLoading(true)
    try {
      const userData = await authService.completeRegistration(email, data)
      setUser(convertToUserType(userData))
      setIsAuth(true)
      setIsFirstAccess(false)
      setEmailLocked(false)
      messageApi.success('Cadastro concluído com sucesso!')
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setIsAuthLoading(true)
    try {
      await authService.resetPassword(email)
      messageApi.success('Email de redefinição enviado com sucesso!')
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setIsAuthLoading(false)
    }
  }

  const checkFirstAccess = async (email: string) => {
    const { isEligible, userData } =
      await authService.checkFirstAccessEligibility(email)

    if (!isEligible) {
      messageApi.error('Seu e-mail não está autorizado')

      return
    }

    setIsFirstAccessEligible(isEligible)
    setFirstAccessData(isEligible ? userData : undefined)
    if (isEligible && isFirstAccess) {
      setEmailLocked(true)
    } else {
      setEmailLocked(false)
      setIsFirstAccess(false)
    }

    messageApi.success('Seu e-mail está autorizado! Realize o primeiro acesso')
  }

  const prefillFirstAccessData = (data?: User) => {
    setFirstAccessData(data)
  }

  const handleSetFirstAccess = (value: boolean) => {
    if (value && !isFirstAccessEligible) return
    setIsFirstAccess(value)
    setEmailLocked(value && isFirstAccessEligible)
  }

  const authContextData = useMemo(
    () => ({
      isAuth,
      user,
      isAuthLoading,
      isFirstAccess,
      isFirstAccessEligible,
      emailLocked,
      login,
      logout,
      inviteUser,
      completeRegistration,
      resetPassword,
      checkFirstAccess,
      setFirstAccess: handleSetFirstAccess,
      prefillFirstAccessData
    }),
    [
      isAuth,
      user,
      isAuthLoading,
      isFirstAccess,
      isFirstAccessEligible,
      emailLocked,
      firstAccessData
    ]
  )

  return (
    <AuthContext.Provider value={authContextData}>
      {contextHolder}
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): IAuthContextData => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export { AuthProvider }
