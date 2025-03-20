// src/contexts/DemandsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import {
  Demand,
  DemandStatus,
  DemandRegistrationFormType
} from '@/@types/demand'
import { UploadFile } from 'antd/lib/upload/interface'
import { demandsService } from '@/services/demands'
import { useAuth } from '@/contexts/AuthProvider'
import { listenToDatabase } from '@/utils/functions/databaseUtils'
import { extractFileInfoFromUrl } from '@/utils/functions/storageUtils'
import { UserRole } from '@/@types/user'

interface DemandsContextData {
  demands: Demand[]
  loading: boolean
  filters: Partial<DemandFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<DemandFilters>>>
  createDemand: (data: DemandRegistrationFormType) => Promise<string>
  updateDemand: (
    id: string,
    data: Partial<DemandRegistrationFormType>
  ) => Promise<void>
  deleteDemand: (id: string) => Promise<void>
  getInitialData: (
    demand: Demand
  ) => Promise<Partial<DemandRegistrationFormType>>
}

interface DemandFilters {
  voterId: string
  status?: DemandStatus
  relatedUserId?: string
  cityId?: string
}

const DemandsContext = createContext<DemandsContextData>(
  {} as DemandsContextData
)

export const DemandsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<DemandFilters>>({})

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = listenToDatabase<Demand>(
      'demands',
      (demandsArray) => {
        let filteredDemands = demandsArray

        // Filtros baseados em permissões
        if (user.role !== UserRole.ADMINISTRADOR_GERAL) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.cityId === user.cityId
          )
        }

        if (user.role === UserRole.VEREADOR) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.relatedUserId === user.id
          )
        }

        if (user.role === UserRole.CABO_ELEITORAL) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.createdBy === user.id
          )
        }

        if (user.role === UserRole.ELEITOR) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.voterId === user.id
          )
        }

        // Filtros dinâmicos
        if (filters.voterId) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.voterId === filters.voterId
          )
        }
        if (filters.status) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.status === filters.status
          )
        }
        if (filters.relatedUserId) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.relatedUserId === filters.relatedUserId
          )
        }
        if (filters.cityId) {
          filteredDemands = filteredDemands.filter(
            (demand) => demand.cityId === filters.cityId
          )
        }

        setDemands(filteredDemands)
        setLoading(false)
      },
      (error) => {
        messageApi.error(
          'Erro ao carregar demandas, tente reiniciar a página ou contacte um administrador'
        )
        setLoading(false)
      }
    )

    return unsubscribe
  }, [filters, user, messageApi])

  const createDemand = async (
    data: DemandRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newDemandId = await demandsService.createDemand(
        data,
        user.id,
        user.cityId || '',
        user.role
      )
      messageApi.success('Demanda criada com sucesso!')
      setLoading(false)
      return newDemandId
    } catch (error: any) {
      messageApi.error('Erro ao criar demanda, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updateDemand = async (
    id: string,
    data: Partial<DemandRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      await demandsService.updateDemand(id, data, user.id)
      messageApi.success('Demanda atualizada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar demanda, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deleteDemand = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await demandsService.deleteDemand(id)
      messageApi.success('Demanda deletada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar demanda, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const getInitialData = async (
    demand: Demand
  ): Promise<Partial<DemandRegistrationFormType>> => {
    const details = demand.details ?? { documents: null, updates: null }

    const documents = details.documents
      ? details.documents.map((url, index) =>
          extractFileInfoFromUrl(url, index)
        )
      : null

    return {
      voterId: demand.voterId,
      cityId: demand.cityId,
      description: demand.description,
      status: demand.status,
      relatedUserId: demand.relatedUserId,
      documents
    }
  }

  return (
    <DemandsContext.Provider
      value={{
        demands,
        loading,
        filters,
        setFilters,
        createDemand,
        updateDemand,
        deleteDemand,
        getInitialData
      }}
    >
      {contextHolder}
      {children}
    </DemandsContext.Provider>
  )
}

export const useDemands = () => useContext(DemandsContext)
