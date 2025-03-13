// src/contexts/VotersProvider.tsx

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

interface VoterFilter {
  cityId?: string
  status?: UserStatus
  name?: string
  genero?: string
  cpf?: string
}

interface VotersContextData {
  voters: User[]
  loading: boolean
  filters: VoterFilter
  setFilters: (filters: VoterFilter) => void
  createVoter: (
    voterData: UserRegistrationFormType,
    cityId: string
  ) => Promise<void>
  updateVoter: (
    voterId: string,
    updates: Partial<User['profile']> & { role?: UserRole; status?: UserStatus }
  ) => Promise<void>
  deleteVoter: (voterId: string) => Promise<void>
  toggleVoterStatus: (voterId: string) => Promise<void>
}

const VotersContext = createContext<VotersContextData>({} as VotersContextData)

export const VotersProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const [voters, setVoters] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<VoterFilter>({})

  const fetchVoters = async () => {
    setLoading(true)
    try {
      const snapshot = await get(ref(db, 'users'))
      const users = snapshot.val() || {}
      const allUsers = Object.values(users) as User[]

      // Filtra apenas eleitores e aplica filtros adicionais
      const filteredVoters = allUsers.filter((user) => {
        return (
          user.role === UserRole.ELEITOR &&
          (!filters.cityId || user.cityId === filters.cityId) &&
          (!filters.status || user.status === filters.status) &&
          (!filters.genero || user.profile?.genero === filters.genero) &&
          (!filters.name ||
            user.profile?.nomeCompleto
              .toLowerCase()
              .includes(filters.name.toLowerCase())) &&
          (!filters.cpf || user.profile?.cpf.includes(filters.cpf))
        )
      })

      setVoters(filteredVoters)
    } catch (error: any) {
      messageApi.error('Erro ao buscar eleitores: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoters()
  }, [filters])

  useEffect(() => {
    console.log(voters)
  }, [voters])

  const createVoter = async (
    voterData: UserRegistrationFormType,
    cityId: string
  ) => {
    setLoading(true)
    try {
      await authService.completeRegistration(
        voterData.email,
        voterData,
        'voterCreation',
        cityId
      )
      messageApi.success('Eleitor cadastrado com sucesso!')
      await fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateVoter = async (
    voterId: string,
    updates: Partial<User['profile']> & { role?: UserRole; status?: UserStatus }
  ) => {
    setLoading(true)
    try {
      const updatedVoter = await authService.editUser(voterId, updates)
      messageApi.success('Eleitor atualizado com sucesso!')
      await fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteVoter = async (voterId: string) => {
    setLoading(true)
    try {
      await authService.deleteUser(voterId)
      messageApi.success('Eleitor excluído com sucesso!')
      await fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const toggleVoterStatus = async (voterId: string) => {
    setLoading(true)
    try {
      const voter = await authService.getUserData(voterId)
      if (!voter) throw new Error('Eleitor não encontrado')

      const newStatus =
        voter.status === UserStatus.ATIVO
          ? UserStatus.SUSPENSO
          : UserStatus.ATIVO

      // Usa editUser para atualizar o status diretamente
      await authService.editUser(voterId, {
        status: newStatus
      })

      messageApi.success('Status do eleitor alterado com sucesso!')
      await fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <VotersContext.Provider
      value={{
        voters,
        loading,
        filters,
        setFilters,
        createVoter,
        updateVoter,
        deleteVoter,
        toggleVoterStatus
      }}
    >
      {contextHolder}
      {children}
    </VotersContext.Provider>
  )
}

export const useVoters = () => {
  const context = useContext(VotersContext)
  if (!context)
    throw new Error('useVoters must be used within a VotersProvider')
  return context
}
