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
  users: User[] // Usuários exceto ELEITOR
  voters: User[] // Apenas ELEITOR
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
}

const UsersContext = createContext<UsersContextData>({} as UsersContextData)

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const [users, setUsers] = useState<User[]>([]) // Usuários exceto ELEITOR
  const [voters, setVoters] = useState<User[]>([]) // Apenas ELEITOR
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<UserFilter>({})

  const fetchUsersAndVoters = async () => {
    setLoading(true)
    try {
      const snapshot = await get(ref(db, 'users'))
      const usersData = snapshot.val() || {}
      const allUsers = Object.values(usersData) as User[]

      // Filtra usuários exceto ELEITOR
      const filteredUsers = allUsers.filter((user) => {
        return (
          user.role !== UserRole.ELEITOR &&
          (!filters.cityId || user.cityId === filters.cityId) &&
          (!filters.status || user.status === filters.status) &&
          (!filters.role || user.role === filters.role) &&
          (!filters.name ||
            user.profile?.nomeCompleto
              ?.toLowerCase()
              .includes(filters.name?.toLowerCase() || '')) &&
          (!filters.email ||
            user.email
              .toLowerCase()
              .includes(filters.email?.toLowerCase() || ''))
        )
      })

      // Filtra apenas ELEITOR
      const filteredVoters = allUsers.filter((user) => {
        return (
          user.role === UserRole.ELEITOR &&
          (!filters.cityId || user.cityId === filters.cityId) &&
          (!filters.status || user.status === filters.status) &&
          (!filters.genero || user.profile?.genero === filters.genero) &&
          (!filters.name ||
            user.profile?.nomeCompleto
              ?.toLowerCase()
              .includes(filters.name?.toLowerCase() || '')) &&
          (!filters.cpf || user.profile?.cpf.includes(filters.cpf || ''))
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
  }, [filters])

  const createUser = async (
    userData: UserRegistrationFormType,
    cityId: string,
    mode: 'userCreation' | 'voterCreation'
  ) => {
    setLoading(true)
    try {
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
      const user = await authService.getUserData(userId)
      if (!user) throw new Error('Usuário/Eleitor não encontrado')

      const newStatus =
        user.status === UserStatus.ATIVO
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
        toggleUserStatus
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
