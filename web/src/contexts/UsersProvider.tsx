// src/contexts/UsersProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { authService } from '@/services/auth'
import {
  FormMode,
  User,
  UserRegistrationFormType,
  UserRole,
  UserStatus
} from '@/@types/user'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { getInitialFormData } from '@/utils/functions/formData'
import { convertToISODate, removeMask } from '@/utils/functions/masks'

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
  allUsers: User[]
  loading: boolean
  filters: UserFilter
  setFilters: (filters: UserFilter) => void
  createUser: (
    userData: UserRegistrationFormType,
    cityId: string,
    mode: Exclude<FormMode, 'viewOnly' | 'viewOnly'>
  ) => Promise<void>
  updateUser: (
    userId: string,
    updates: Partial<User['profile']> & { role?: UserRole; status?: UserStatus }
  ) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  toggleUserStatus: (userId: string) => Promise<void>
  getInitialData: (user: User) => Partial<UserRegistrationFormType>
  getUserById: (userId: string) => User | null
}

const UsersContext = createContext<UsersContextData>({} as UsersContextData)

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const { user } = useAuth()
  const { cities } = useCities()
  const [users, setUsers] = useState<User[]>([])
  const [voters, setVoters] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<UserFilter>({})

  const fetchUsersAndVoters = async () => {
    if (!user) return

    setLoading(true)
    try {
      const snapshot = await get(ref(db, 'users'))
      const usersData = snapshot.val() || {}
      const allUsers = Object.values(usersData) as User[]

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

  useEffect(() => {
    setAllUsers([...voters, ...users])
  }, [user, voters])

  const createUser = async (
    userData: UserRegistrationFormType,
    cityId: string,
    mode: Exclude<FormMode, 'viewOnly' | 'viewOnly'>
  ) => {
    if (!user || !cities.some((city) => city.id === cityId)) {
      throw new Error('Cidade inválida ou usuário não autenticado')
    }

    setLoading(true)
    try {
      if (mode === 'userCreation' && userData.creationMode === 'fromVoter') {
        // Caso especial: criação a partir de eleitor é uma atualização
        if (!userData.voterId) {
          throw new Error(
            'ID do eleitor é obrigatório para criação a partir de eleitor.'
          )
        }
        const profileUpdates = {
          nomeCompleto: userData.nomeCompleto,
          cpf: userData.cpf ? removeMask(userData.cpf) : undefined,
          dataNascimento: convertToISODate(userData.dataNascimento),
          genero: userData.genero,
          religiao: userData.religiao || null,
          foto: userData.foto || null,
          telefone: userData.telefone ? removeMask(userData.telefone) : null,
          whatsapp: removeMask(userData.whatsapp),
          instagram: userData.instagram || null,
          facebook: userData.facebook || null,
          cep: removeMask(userData.cep),
          endereco: userData.endereco,
          numero: userData.numero,
          complemento: userData.complemento || null,
          bairro: userData.bairro,
          cidade: userData.cidade,
          estado: userData.estado
        }

        const updates = {
          ...profileUpdates,
          role: userData.role,
          cityId: cityId
        }
        await authService.editUser(userData.voterId, updates)
        messageApi.success('Usuário criado a partir do eleitor com sucesso!')
      } else {
        // Criação normal
        if (!userData.email) {
          throw new Error('Email é obrigatório para criar um usuário.')
        }
        await authService.completeRegistration(
          userData.email,
          userData,
          mode,
          cityId
        )
        messageApi.success(
          mode === 'userCreation'
            ? 'Usuário cadastrado com sucesso!'
            : 'Eleitor cadastrado com sucesso!'
        )
      }
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
        userData.status === UserStatus.ATIVO
          ? UserStatus.SUSPENSO
          : UserStatus.ATIVO
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
    return getInitialFormData(user)
  }

  const getUserById = (userId?: string): User | null => {
    return allUsers.find((user) => user.id === userId) || null
  }

  return (
    <UsersContext.Provider
      value={{
        users,
        voters,
        allUsers,
        loading,
        filters,
        setFilters,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        getInitialData,
        getUserById
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
