// src/contexts/PollsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import {
  Poll,
  PollRegistrationFormType,
  PollResponse,
  PollResponseFormType
} from '@/@types/poll'
import { Segment } from '@/@types/segment'
import { UserRole } from '@/@types/user'
import { pollService } from '@/services/poll'
import { useAuth } from '@/contexts/AuthProvider'
import { listenToDatabase } from '@/utils/functions/databaseUtils'

interface PollsContextData {
  polls: Poll[]
  loading: boolean
  createPoll: (
    data: PollRegistrationFormType,
    segment: Segment
  ) => Promise<string>
  updatePoll: (
    id: string,
    data: Partial<PollRegistrationFormType>
  ) => Promise<void>
  deletePoll: (id: string) => Promise<void>
  togglePollActive: (id: string, isActive: boolean) => Promise<void>
  submitResponse: (
    pollId: string,
    response: PollResponseFormType
  ) => Promise<void>
  getResponses: (pollId: string) => Promise<PollResponse[]>
}

const PollsContext = createContext<PollsContextData>({} as PollsContextData)

export const PollsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = listenToDatabase<Poll>(
      'polls',
      (pollsArray) => {
        let filteredPolls = pollsArray

        if (user.role !== UserRole.ADMINISTRADOR_GERAL) {
          filteredPolls = filteredPolls.filter(
            (poll) => poll.createdBy === user.id
          )
        }

        setPolls(filteredPolls)
        setLoading(false)
      },
      (error) => {
        messageApi.error('Erro ao carregar enquetes, tente reiniciar a página.')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, messageApi])

  const createPoll = async (
    data: PollRegistrationFormType,
    segment: Segment
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newPollId = await pollService.createPoll(data, user.id, segment)
      messageApi.success('Enquete criada com sucesso!')
      setLoading(false)
      return newPollId
    } catch (error: any) {
      messageApi.error('Erro ao criar enquete, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updatePoll = async (
    id: string,
    data: Partial<PollRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      await pollService.updatePoll(id, data)
      messageApi.success('Enquete atualizada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar enquete, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deletePoll = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await pollService.deletePoll(id)
      messageApi.success('Enquete deletada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar enquete, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const togglePollActive = async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    setLoading(true)
    try {
      await pollService.updatePoll(id, { isActive })
      messageApi.success(
        `Enquete ${isActive ? 'ativada' : 'desativada'} com sucesso!`
      )
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar o status da enquete, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const submitResponse = async (
    pollId: string,
    response: PollResponseFormType
  ): Promise<void> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      await pollService.submitResponse(pollId, user.id, response)
      messageApi.success('Resposta enviada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao enviar resposta, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const getResponses = async (pollId: string): Promise<PollResponse[]> => {
    setLoading(true)
    try {
      const responses = await pollService.getResponses(pollId)
      setLoading(false)
      return responses
    } catch (error: any) {
      messageApi.error('Erro ao carregar respostas, tente novamente')
      setLoading(false)
      throw error
    }
  }

  return (
    <PollsContext.Provider
      value={{
        polls,
        loading,
        createPoll,
        updatePoll,
        deletePoll,
        togglePollActive,
        submitResponse,
        getResponses
      }}
    >
      {contextHolder}
      {children}
    </PollsContext.Provider>
  )
}

export const usePolls = () => useContext(PollsContext)
