// src/contexts/UsersProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { authService } from '@/services/auth'
import {
  User,
  UserRegistrationFormType,
  UserRole,
  UserStatus
} from '@/@types/user'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'

interface UserFilter {
  cityId?: string
  status?: UserStatus
  name?: string
  email?: string
  role?: UserRole
  genero?: string
  cpf?: string
}

interface UsersContextData {
  users: User[]
  voters: User[]
  loading: boolean
  filters: UserFilter
  setFilters: (filters: UserFilter) => void
  createUser: (
    userData: UserRegistrationFormType,
    cityId: string,
    mode: 'userCreation' | 'voterCreation'
  ) => Promise<void>
  updateUser: (
    userId: string,
    updates: Partial<User['profile']> & { role?: UserRole; status?: UserStatus }
  ) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  toggleUserStatus: (userId: string) => Promise<void>
  getInitialData: (user: User) => Partial<UserRegistrationFormType>
}

const UsersContext = createContext<UsersContextData>({} as UsersContextData)

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const { user } = useAuth()
  const { cities } = useCities()
  const [users, setUsers] = useState<User[]>([])
  const [voters, setVoters] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<UserFilter>({})

  const fetchUsersAndVoters = async () => {
    if (!user) return

    setLoading(true)
    try {
      const snapshot = await get(ref(db, 'users'))
      const usersData = snapshot.val() || {}
      const allUsers = Object.values(usersData) as User[]

      // Restringe usuários visíveis com base no papel do usuário logado
      const allowedCityIds =
        user.role === UserRole.ADMINISTRADOR_GERAL
          ? cities.map((city) => city.id)
          : [user.cityId]

      const filteredUsers = allUsers.filter((u) => {
        return (
          u.role !== UserRole.ELEITOR &&
          allowedCityIds.includes(u.cityId) &&
          (!filters.cityId || u.cityId === filters.cityId) &&
          (!filters.status || u.status === filters.status) &&
          (!filters.role || u.role === filters.role) &&
          (!filters.name ||
            u.profile?.nomeCompleto
              ?.toLowerCase()
              .includes(filters.name?.toLowerCase() || '')) &&
          (!filters.email ||
            u.email.toLowerCase().includes(filters.email?.toLowerCase() || ''))
        )
      })

      const filteredVoters = allUsers.filter((u) => {
        return (
          u.role === UserRole.ELEITOR &&
          allowedCityIds.includes(u.cityId) &&
          (!filters.cityId || u.cityId === filters.cityId) &&
          (!filters.status || u.status === filters.status) &&
          (!filters.genero || u.profile?.genero === filters.genero) &&
          (!filters.name ||
            u.profile?.nomeCompleto
              ?.toLowerCase()
              .includes(filters.name?.toLowerCase() || '')) &&
          (!filters.cpf || u.profile?.cpf.includes(filters.cpf || ''))
        )
      })

      setUsers(filteredUsers)
      setVoters(filteredVoters)
    } catch (error: any) {
      messageApi.error('Erro ao buscar usuários/eleitores: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsersAndVoters()
  }, [filters, user, cities])

  const createUser = async (
    userData: UserRegistrationFormType,
    cityId: string,
    mode: 'userCreation' | 'voterCreation'
  ) => {
    if (!user || !cities.some((city) => city.id === cityId)) {
      throw new Error('Cidade inválida ou usuário não autenticado')
    }

    setLoading(true)
    try {
      await authService.completeRegistration(userData.email, userData, mode, cityId)
      messageApi.success(
        mode === 'userCreation'
          ? 'Usuário cadastrado com sucesso!'
          : 'Eleitor cadastrado com sucesso!'
      )
      await fetchUsersAndVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (
    userId: string,
    updates: Partial<User['profile']> & { role?: UserRole; status?: UserStatus }
  ) => {
    setLoading(true)
    try {
      await authService.editUser(userId, updates)
      messageApi.success('Usuário/Eleitor atualizado com sucesso!')
      await fetchUsersAndVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    setLoading(true)
    try {
      await authService.deleteUser(userId)
      messageApi.success('Usuário/Eleitor excluído com sucesso!')
      await fetchUsersAndVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    setLoading(true)
    try {
      const userData = await authService.getUserData(userId)
      if (!userData) throw new Error('Usuário/Eleitor não encontrado')

      const newStatus =
        userData.status === UserStatus.ATIVO ? UserStatus.SUSPENSO : UserStatus.ATIVO
      await authService.editUser(userId, { status: newStatus })
      messageApi.success('Status do usuário/eleitor alterado com sucesso!')
      await fetchUsersAndVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getInitialData = (user: User): Partial<UserRegistrationFormType> => {
    return {
      email: user.email,
      nomeCompleto: user.profile?.nomeCompleto || '',
      cpf: user.profile?.cpf || '',
      dataNascimento: user.profile?.dataNascimento || '',
      genero: user.profile?.genero || undefined,
      religiao: user.profile?.religiao || undefined,
      foto: user.profile?.foto || null,
      telefone: user.profile?.telefone || null,
      whatsapp: user.profile?.whatsapp || '',
      instagram: user.profile?.instagram || null,
      facebook: user.profile?.facebook || null,
      cep: user.profile?.cep || '',
      endereco: user.profile?.endereco || '',
      numero: user.profile?.numero || '',
      complemento: user.profile?.complemento || null,
      bairro: user.profile?.bairro || '',
      cidade: user.profile?.cidade || '',
      estado: user.profile?.estado || '',
      role: user.role
    }
  }

  return (
    <UsersContext.Provider
      value={{
        users,
        voters,
        loading,
        filters,
        setFilters,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        getInitialData
      }}
    >
      {contextHolder}
      {children}
    </UsersContext.Provider>
  )
}

export const useUsers = () => {
  const context = useContext(UsersContext)
  if (!context) throw new Error('useUsers must be used within a UsersProvider')
  return context
}