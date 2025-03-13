// src/contexts/VotersProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { User } from '@/@types/user'
import { voterService, VoterFilter } from '@/services/voters'

interface VotersContextData {
  voters: User[]
  loading: boolean
  filters: VoterFilter
  setFilters: (filters: VoterFilter) => void
  createVoter: (voterData: Partial<User>) => Promise<void>
  updateVoter: (voterId: string, updates: Partial<User>) => Promise<void>
  deleteVoter: (voterId: string) => Promise<void>
  toggleVoterStatus: (voterId: string, currentStatus: string) => Promise<void>
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
      const data = await voterService.fetchVoters(filters)
      setVoters(data)
    } catch (error: any) {
      messageApi.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoters()
  }, [filters])

  const createVoter = async (voterData: Partial<User>) => {
    setLoading(true)
    try {
      await voterService.createVoter(voterData)
      messageApi.success('Eleitor cadastrado com sucesso!')
      fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateVoter = async (voterId: string, updates: Partial<User>) => {
    setLoading(true)
    try {
      await voterService.updateVoter(voterId, updates)
      messageApi.success('Eleitor atualizado com sucesso!')
      fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteVoter = async (voterId: string) => {
    setLoading(true)
    try {
      await voterService.deleteVoter(voterId)
      messageApi.success('Eleitor excluído com sucesso!')
      fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleVoterStatus = async (voterId: string, currentStatus: string) => {
    setLoading(true)
    try {
      await voterService.toggleVoterStatus(voterId, currentStatus)
      messageApi.success('Status do eleitor alterado com sucesso!')
      fetchVoters()
    } catch (error: any) {
      messageApi.error(error.message)
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
