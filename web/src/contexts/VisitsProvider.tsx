// src/contexts/VisitsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { Visit, VisitRegistrationFormType, VisitStatus } from '@/@types/visit'
import { UploadFile } from 'antd/lib/upload/interface'
import { visitsService } from '@/services/visits'
import { useAuth } from '@/contexts/AuthProvider'
import { extractFileInfoFromUrl } from '@/utils/functions/storageUtils'
import moment from 'moment'
import { listenToDatabase } from '@/utils/functions/databaseUtils'

interface VisitsContextData {
  visits: Visit[]
  loading: boolean
  filters: Partial<VisitFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<VisitFilters>>>
  createVisit: (data: VisitRegistrationFormType) => Promise<string>
  updateVisit: (
    id: string,
    data: Partial<VisitRegistrationFormType>
  ) => Promise<void>
  deleteVisit: (id: string) => Promise<void>
  getInitialData: (visit: Visit) => Promise<Partial<VisitRegistrationFormType>>
}

interface VisitFilters {
  voterId: string
  status?: VisitStatus
  relatedUserId?: string
  cityId?: string
}

const VisitsContext = createContext<VisitsContextData>({} as VisitsContextData)

export const VisitsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<VisitFilters>>({})

  useEffect(() => {
    setLoading(true)
    const unsubscribe = listenToDatabase<Visit>(
      'visits',
      (visitsArray) => {
        let filteredVisits = visitsArray
        if (filters.voterId) {
          filteredVisits = filteredVisits.filter(
            (visit) => visit.voterId === filters.voterId
          )
        }
        if (filters.status) {
          filteredVisits = filteredVisits.filter(
            (visit) => visit.status === filters.status
          )
        }
        if (filters.relatedUserId) {
          filteredVisits = filteredVisits.filter(
            (visit) => visit.details.relatedUserId === filters.relatedUserId
          )
        }
        if (filters.cityId) {
          filteredVisits = filteredVisits.filter(
            (visit) => visit.cityId === filters.cityId
          )
        }
        setVisits(filteredVisits)
        setLoading(false)
      },
      (error) => {
        messageApi.error(
          'Erro ao carregar visitas, tente reiniciar a página ou contacte um administrador'
        )
        setLoading(false)
      }
    )

    return unsubscribe
  }, [filters, messageApi])

  const createVisit = async (
    data: VisitRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newVisitId = await visitsService.createVisit(
        data,
        user.id,
        user.cityId || ''
      )
      messageApi.success('Visita criada com sucesso!')
      setLoading(false)
      return newVisitId
    } catch (error: any) {
      messageApi.error('Erro ao criar visita, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updateVisit = async (
    id: string,
    data: Partial<VisitRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      await visitsService.updateVisit(id, data)
      messageApi.success('Visita atualizada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar visita, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deleteVisit = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await visitsService.deleteVisit(id)
      messageApi.success('Visita deletada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar visita, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const getInitialData = async (
    visit: Visit
  ): Promise<Partial<VisitRegistrationFormType>> => {
    const documents = visit.details.documents
      ? visit.details.documents.map((url, index) =>
          extractFileInfoFromUrl(url, index)
        )
      : null

    return {
      voterId: visit.voterId,
      cityId: visit.cityId,
      dateTime: visit.dateTime
        ? moment(visit.dateTime).format('DD/MM/YYYY HH:mm')
        : '',
      status: visit.status,
      reason: visit.details.reason,
      relatedUserId: visit.details.relatedUserId,
      documents,
      observations: visit.details.observations || null
    }
  }

  return (
    <VisitsContext.Provider
      value={{
        visits,
        loading,
        filters,
        setFilters,
        createVisit,
        updateVisit,
        deleteVisit,
        getInitialData
      }}
    >
      {contextHolder}
      {children}
    </VisitsContext.Provider>
  )
}

export const useVisits = () => useContext(VisitsContext)
