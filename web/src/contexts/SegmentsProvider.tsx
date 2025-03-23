// src/contexts/SegmentsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { Segment, SegmentRegistrationFormType } from '@/@types/segment'
import { UserRole } from '@/@types/user'
import { segmentService } from '@/services/segment'
import { useAuth } from '@/contexts/AuthProvider'
import { listenToDatabase } from '@/utils/functions/databaseUtils'

interface SegmentsContextData {
  segments: Segment[]
  loading: boolean
  createSegment: (data: SegmentRegistrationFormType) => Promise<string>
  updateSegment: (
    id: string,
    data: Partial<SegmentRegistrationFormType>
  ) => Promise<void>
  deleteSegment: (id: string) => Promise<void>
  toggleSegmentActive: (id: string, isActive: boolean) => Promise<void>
}

const SegmentsContext = createContext<SegmentsContextData>(
  {} as SegmentsContextData
)

export const SegmentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = listenToDatabase<Segment>(
      'segments',
      (segmentsArray) => {
        let filteredSegments = segmentsArray

        // if (user.role !== UserRole.ADMINISTRADOR_GERAL) {
        //   filteredSegments = filteredSegments.filter(
        //     (segment) => segment.cityIds === user.cityIds
        //   )
        // }

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

  const createSegment = async (
    data: SegmentRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newSegmentId = await segmentService.createSegment(data, user.id)
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

  const toggleSegmentActive = async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    setLoading(true)
    try {
      await segmentService.updateSegment(id, { isActive })
      messageApi.success(
        `Segmento ${isActive ? 'ativado' : 'desativado'} com sucesso!`
      )
      setLoading(false)
    } catch (error: any) {
      messageApi.error(
        'Erro ao atualizar o status do segmento, tente novamente'
      )
      setLoading(false)
      throw error
    }
  }

  return (
    <SegmentsContext.Provider
      value={{
        segments,
        loading,
        createSegment,
        updateSegment,
        deleteSegment,
        toggleSegmentActive
      }}
    >
      {contextHolder}
      {children}
    </SegmentsContext.Provider>
  )
}

export const useSegments = () => useContext(SegmentsContext)
