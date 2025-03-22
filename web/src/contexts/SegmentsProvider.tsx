// src/contexts/SegmentsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { Segment, SegmentRegistrationFormType } from '@/@types/segment'
import { User, UserRole } from '@/@types/user'
import { Demand, DemandStatus } from '@/@types/demand'
import { segmentService } from '@/services/segment'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import { useDemands } from '@/contexts/DemandsProvider'
import { listenToDatabase } from '@/utils/functions/databaseUtils'
import moment from 'moment'

interface SegmentsContextData {
  segments: Segment[]
  filteredVoters: User[]
  loading: boolean
  filters: Partial<SegmentFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<SegmentFilters>>>
  createSegment: (data: SegmentRegistrationFormType) => Promise<string>
  updateSegment: (
    id: string,
    data: Partial<SegmentRegistrationFormType>
  ) => Promise<void>
  deleteSegment: (id: string) => Promise<void>
  applySegmentFilters: (segment: Segment) => void
}

interface SegmentFilters {
  bairro?: string
  idadeMin?: number
  idadeMax?: number
  demandStatus?: DemandStatus[]
  cityId?: string
  scope?: 'minhaBase' | 'cidadeCompleta'
}

const SegmentsContext = createContext<SegmentsContextData>(
  {} as SegmentsContextData
)

export const SegmentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const { voters, allUsers } = useUsers()
  const { demands } = useDemands()
  const [messageApi, contextHolder] = message.useMessage()
  const [segments, setSegments] = useState<Segment[]>([])
  const [filteredVoters, setFilteredVoters] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<SegmentFilters>>({
    scope: 'cidadeCompleta'
  })

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = listenToDatabase<Segment>(
      'segments',
      (segmentsArray) => {
        let filteredSegments = segmentsArray

        if (user.role !== UserRole.ADMINISTRADOR_GERAL) {
          filteredSegments = filteredSegments.filter(
            (segment) => segment.cityId === user.cityId
          )
        }

        setSegments(filteredSegments)
        setLoading(false)
      },
      (error) => {
        messageApi.error(
          'Erro ao carregar segmentos, tente reiniciar a página.'
        )
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, messageApi])

  useEffect(() => {
    const applyFilters = () => {
      let filtered = voters

      if (user?.role === UserRole.VEREADOR && filters.scope === 'minhaBase') {
        filtered = filtered.filter((voter) => voter.vereadorId === user.id)
      } else if (user?.role !== UserRole.ADMINISTRADOR_GERAL) {
        filtered = filtered.filter((voter) => voter.cityId === user?.cityId)
      }

      if (filters.cityId) {
        filtered = filtered.filter((voter) => voter.cityId === filters.cityId)
      }

      if (filters.bairro) {
        filtered = filtered.filter(
          (voter) => voter.profile?.bairro === filters.bairro
        )
      }

      if (filters.idadeMin || filters.idadeMax) {
        filtered = filtered.filter((voter) => {
          const birthDate = voter.profile?.dataNascimento
          if (!birthDate) return false
          const age = moment('2025-03-22').diff(moment(birthDate), 'years')
          const min = filters.idadeMin || 18
          const max = filters.idadeMax || 100
          return age >= min && age <= max
        })
      }

      if (filters.demandStatus && filters.demandStatus.length > 0) {
        const voterIdsWithDemands = demands
          .filter((demand) => filters.demandStatus!.includes(demand.status))
          .map((demand) => demand.voterId)
        filtered = filtered.filter((voter) =>
          voterIdsWithDemands.includes(voter.id)
        )
      }

      setFilteredVoters(filtered)
    }

    applyFilters()
  }, [filters, voters, demands, user])

  const applySegmentFilters = (segment: Segment) => {
    setFilters({
      bairro: segment.filters.bairro,
      idadeMin: segment.filters.idadeMin,
      idadeMax: segment.filters.idadeMax,
      demandStatus: segment.filters.demandStatus,
      cityId: segment.cityId,
      scope: filters.scope
    })
  }

  const createSegment = async (
    data: SegmentRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newSegmentId = await segmentService.createSegment(
        data,
        user.id,
        user.cityId || ''
      )
      messageApi.success('Segmento criado com sucesso!')
      setLoading(false)
      return newSegmentId
    } catch (error: any) {
      messageApi.error('Erro ao criar segmento, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updateSegment = async (
    id: string,
    data: Partial<SegmentRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      await segmentService.updateSegment(id, data)
      messageApi.success('Segmento atualizado com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar segmento, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deleteSegment = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await segmentService.deleteSegment(id)
      messageApi.success('Segmento deletado com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar segmento, tente novamente')
      setLoading(false)
      throw error
    }
  }

  return (
    <SegmentsContext.Provider
      value={{
        segments,
        filteredVoters,
        loading,
        filters,
        setFilters,
        createSegment,
        updateSegment,
        deleteSegment,
        applySegmentFilters
      }}
    >
      {contextHolder}
      {children}
    </SegmentsContext.Provider>
  )
}

export const useSegments = () => useContext(SegmentsContext)
