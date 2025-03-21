// src/contexts/TicketsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import {
  Ticket,
  TicketRegistrationFormType,
  TicketStatus,
  Message
} from '@/@types/tickets'
import { ticketsService } from '@/services/tickets'
import { useAuth } from '@/contexts/AuthProvider'
import { listenToDatabase } from '@/utils/functions/databaseUtils'
import { extractFileInfoFromUrl } from '@/utils/functions/storageUtils'
import { UserRole } from '@/@types/user'

interface TicketsContextData {
  tickets: Ticket[]
  loading: boolean
  filters: Partial<TicketFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<TicketFilters>>>
  createTicket: (data: TicketRegistrationFormType) => Promise<string>
  updateTicket: (
    id: string,
    data: Partial<TicketRegistrationFormType>
  ) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  sendMessage: (
    ticketId: string,
    content: string,
    attachments?: File[]
  ) => Promise<string>
  markMessageAsRead: (ticketId: string, messageId: string) => Promise<void>
  getInitialData: (
    ticket: Ticket
  ) => Promise<Partial<TicketRegistrationFormType>>
}

interface TicketFilters {
  cityId?: string
  participantId?: string
  status?: TicketStatus
}

const TicketsContext = createContext<TicketsContextData>(
  {} as TicketsContextData
)

export const TicketsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<TicketFilters>>({})

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribe = listenToDatabase<Ticket>(
      'tickets',
      (ticketsArray) => {
        let filteredTickets = ticketsArray

        // Filtros baseados em permissões
        if (user.role !== UserRole.ADMINISTRADOR_GERAL) {
          filteredTickets = filteredTickets.filter(
            (ticket) => ticket.cityId === user.cityId
          )
        }

        filteredTickets = filteredTickets.filter((ticket) =>
          ticket.participants.includes(user.id)
        )

        // Filtros dinâmicos
        if (filters.cityId) {
          filteredTickets = filteredTickets.filter(
            (ticket) => ticket.cityId === filters.cityId
          )
        }
        if (filters.participantId) {
          filteredTickets = filteredTickets.filter((ticket) =>
            ticket.participants.includes(filters.participantId!)
          )
        }
        if (filters.status) {
          filteredTickets = filteredTickets.filter(
            (ticket) => ticket.status === filters.status
          )
        }

        setTickets(filteredTickets)
        setLoading(false)
      },
      (error) => {
        messageApi.error(
          'Erro ao carregar tickets, tente reiniciar a página ou contacte um administrador'
        )
        setLoading(false)
      }
    )

    return unsubscribe
  }, [filters, user, messageApi])

  const createTicket = async (
    data: TicketRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newTicketId = await ticketsService.createTicket(
        data,
        user.id,
        user.cityId || '',
        user.role
      )
      messageApi.success('Ticket criado com sucesso!')
      setLoading(false)
      return newTicketId
    } catch (error: any) {
      messageApi.error('Erro ao criar ticket, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updateTicket = async (
    id: string,
    data: Partial<TicketRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      await ticketsService.updateTicket(id, data, user.id)
      messageApi.success('Ticket atualizado com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar ticket, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deleteTicket = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await ticketsService.deleteTicket(id)
      messageApi.success('Ticket deletado com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar ticket, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const sendMessage = async (
    ticketId: string,
    content: string,
    attachments?: File[]
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const messageId = await ticketsService.sendMessage(
        ticketId,
        user.id,
        content,
        attachments
      )
      messageApi.success('Mensagem enviada com sucesso!')
      setLoading(false)
      return messageId
    } catch (error: any) {
      messageApi.error('Erro ao enviar mensagem, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const markMessageAsRead = async (
    ticketId: string,
    messageId: string
  ): Promise<void> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      await ticketsService.markMessageAsRead(ticketId, messageId, user.id)
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao marcar mensagem como lida, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const getInitialData = async (
    ticket: Ticket
  ): Promise<Partial<TicketRegistrationFormType>> => {
    const initialMessage = ticket.messages[0]?.content || ''
    const attachments = ticket.messages[0]?.attachments
      ? ticket.messages[0].attachments.map((url, index) =>
          extractFileInfoFromUrl(url, index)
        )
      : null

    return {
      title: ticket.title,
      description: ticket.description,
      cityId: ticket.cityId,
      participants: ticket.participants,
      relatedDemandId: ticket.relatedDemandId,
      relatedEventId: ticket.relatedEventId,
      initialMessage,
      attachments
    }
  }

  return (
    <TicketsContext.Provider
      value={{
        tickets,
        loading,
        filters,
        setFilters,
        createTicket,
        updateTicket,
        deleteTicket,
        sendMessage,
        markMessageAsRead,
        getInitialData
      }}
    >
      {contextHolder}
      {children}
    </TicketsContext.Provider>
  )
}

export const useTickets = () => useContext(TicketsContext)
