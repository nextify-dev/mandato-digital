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
}

interface UsersContextData {
  users: User[]
  loading: boolean
  filters: UserFilter
  setFilters: (filters: UserFilter) => void
  createUser: (
    userData: UserRegistrationFormType,
    cityId: string
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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<UserFilter>({})

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const snapshot = await get(ref(db, 'users'))
      const usersData = snapshot.val() || {}
      const allUsers = Object.values(usersData) as User[]

      // Filtra usuários excluindo ELEITOR e aplica filtros adicionais
      const filteredUsers = allUsers.filter((user) => {
        return (
          user.role !== UserRole.ELEITOR &&
          (!filters.cityId || user.cityId === filters.cityId) &&
          (!filters.status || user.status === filters.status) &&
          (!filters.role || user.role === filters.role) &&
          (!filters.name ||
            user.profile?.nomeCompleto
              ?.toLowerCase()
              .includes(filters.name.toLowerCase())) &&
          (!filters.email ||
            user.email.toLowerCase().includes(filters.email.toLowerCase()))
        )
      })

      setUsers(filteredUsers)
    } catch (error: any) {
      messageApi.error('Erro ao buscar usuários: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const createUser = async (
    userData: UserRegistrationFormType,
    cityId: string
  ) => {
    setLoading(true)
    try {
      await authService.completeRegistration(
        userData.email,
        userData,
        'userCreation',
        cityId
      )
      messageApi.success('Usuário cadastrado com sucesso!')
      await fetchUsers()
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
      messageApi.success('Usuário atualizado com sucesso!')
      await fetchUsers()
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
      messageApi.success('Usuário excluído com sucesso!')
      await fetchUsers()
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
      if (!user) throw new Error('Usuário não encontrado')

      const newStatus =
        user.status === UserStatus.ATIVO
          ? UserStatus.SUSPENSO
          : UserStatus.ATIVO

      await authService.editUser(userId, { status: newStatus })
      messageApi.success('Status do usuário alterado com sucesso!')
      await fetchUsers()
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
