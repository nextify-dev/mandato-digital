// src/services/tickets.ts

import { ref, push } from 'firebase/database'
import { db } from '@/lib/firebase'
import {
  Ticket,
  TicketRegistrationFormType,
  Message,
  TicketStatus,
  MessageStatus
} from '@/@types/tickets'
import { UserRole, User } from '@/@types/user'
import { authService } from '@/services/auth'
import {
  uploadFilesToStorage,
  deleteFilesFromStorage
} from '@/utils/functions/storageUtils'
import {
  saveToDatabase,
  fetchFromDatabase,
  deleteFromDatabase
} from '@/utils/functions/databaseUtils'
import { RcFile } from 'antd/es/upload'

interface TicketsService {
  createTicket(
    data: TicketRegistrationFormType,
    userId: string,
    userCityId: string,
    userRole: UserRole
  ): Promise<string>
  updateTicket(
    id: string,
    data: Partial<TicketRegistrationFormType>,
    updatedBy: string
  ): Promise<void>
  updateTicketStatus(
    id: string,
    status: TicketStatus,
    updatedBy: string
  ): Promise<void>
  deleteTicket(id: string): Promise<void>
  sendMessage(
    ticketId: string,
    senderId: string,
    content: string,
    attachments?: File[]
  ): Promise<string>
  markMessageAsRead(
    ticketId: string,
    messageId: string,
    userId: string
  ): Promise<void>
  fetchTickets(filters: Partial<TicketFilters>): Promise<Ticket[]>
  fetchTicketById(id: string): Promise<Ticket | null>
}

interface TicketFilters {
  cityId?: string
  participantId?: string
  status?: TicketStatus
  createdBy?: string
  relatedDemandId?: string
  relatedEventId?: string
}

const generateProtocol = async (): Promise<string> => {
  const tickets = (await fetchFromDatabase<Ticket>('tickets')) as Ticket[]
  const ticketCount = tickets.length + 1
  return `TICKET-${new Date().getFullYear()}-${ticketCount
    .toString()
    .padStart(4, '0')}`
}

const validateParticipants = async (
  participants: string[],
  userId: string,
  userRole: UserRole
): Promise<void> => {
  const creator = (await fetchFromDatabase<User>(
    `users/${userId}`,
    undefined,
    true
  )) as User
  if (!creator) throw new Error('Usuário não encontrado')

  for (const participantId of participants) {
    if (participantId === userId) continue // Ignora o próprio usuário

    const participant = (await fetchFromDatabase<User>(
      `users/${participantId}`,
      undefined,
      true
    )) as User
    if (!participant)
      throw new Error(`Participante ${participantId} não encontrado`)

    if (userRole === UserRole.ELEITOR) {
      if (
        participant.role !== UserRole.VEREADOR &&
        participant.role !== UserRole.CABO_ELEITORAL
      ) {
        throw new Error(
          'Eleitores só podem abrir tickets com vereadores ou cabos eleitorais'
        )
      }
      if (
        participant.id !== creator.vereadorId &&
        participant.id !== creator.caboEleitoralId
      ) {
        throw new Error(
          'Você só pode abrir tickets com seu vereador ou cabo eleitoral vinculado'
        )
      }
    } else if (userRole === UserRole.CABO_ELEITORAL) {
      if (
        participant.role !== UserRole.ELEITOR &&
        participant.role !== UserRole.VEREADOR
      ) {
        throw new Error(
          'Cabos eleitorais só podem abrir tickets com eleitores ou vereadores'
        )
      }
      if (
        participant.role === UserRole.ELEITOR &&
        participant.caboEleitoralId !== userId
      ) {
        throw new Error(
          'Você só pode abrir tickets com eleitores vinculados a você'
        )
      }
    }
  }
}

export const ticketsService: TicketsService = {
  async createTicket(
    data: TicketRegistrationFormType,
    userId: string,
    userCityId: string,
    userRole: UserRole
  ): Promise<string> {
    // Validar participantes
    await validateParticipants(data.participants, userId, userRole)

    const newTicketId = push(ref(db, 'tickets')).key!
    const protocol = await generateProtocol()
    const storagePath = `tickets/${newTicketId}/messages`

    // Criar o ticket sem mensagens inicialmente
    const newTicket: Ticket = {
      id: newTicketId,
      protocol,
      title: data.title,
      description: data.description,
      status: TicketStatus.ABERTO,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      cityId: data.cityId || userCityId,
      participants: data.participants,
      messages: [],
      relatedDemandId: data.relatedDemandId || null,
      relatedEventId: data.relatedEventId || null,
      lastUpdatedAt: new Date().toISOString()
    }

    // Salvar o ticket no Firebase usando databaseUtils
    try {
      await saveToDatabase('tickets', newTicket)
    } catch (error) {
      throw new Error(`Falha ao criar ticket: ${error}`)
    }

    // Se houver mensagem inicial, enviá-la como uma mensagem normal
    if (data.initialMessage && data.initialMessage.trim()) {
      let attachmentUrls: string[] = []
      if (data.attachments && data.attachments.length > 0) {
        const filesToUpload = data.attachments
          .map((file) => file.originFileObj)
          .filter((file): file is RcFile => file instanceof File)

        if (filesToUpload.length !== data.attachments.length) {
          throw new Error(
            'Todos os anexos devem ter originFileObj. Reanexe os arquivos existentes.'
          )
        }

        try {
          await deleteFilesFromStorage(storagePath)
        } catch (error) {
          throw new Error(
            `Falha ao limpar arquivos antigos no Storage: ${error}`
          )
        }

        attachmentUrls = await uploadFilesToStorage(storagePath, filesToUpload)
      }

      const newMessage: Message = {
        id: push(ref(db, `tickets/${newTicketId}/messages`)).key!,
        senderId: userId,
        content: data.initialMessage,
        timestamp: new Date().toISOString(),
        status: MessageStatus.ENVIADA,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
        readBy: [userId]
      }

      try {
        await saveToDatabase(`tickets/${newTicketId}/messages`, newMessage)
      } catch (error) {
        if (attachmentUrls.length > 0) {
          await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
            console.warn('Erro ao limpar arquivos após falha:', cleanupError)
          )
        }
        throw new Error(`Falha ao salvar mensagem inicial: ${error}`)
      }
    }

    // Registrar no histórico do eleitor, se aplicável
    const eleitor = await Promise.all(
      data.participants.map(async (id) => {
        const user = (await fetchFromDatabase<User>(
          `users/${id}`,
          undefined,
          true
        )) as User
        return user?.role === UserRole.ELEITOR ? id : null
      })
    ).then((results) => results.find((id) => id !== null))

    if (eleitor) {
      console.log(
        `Registrando ticket ${newTicketId} no histórico do eleitor ${eleitor}`
      )
    }

    return newTicketId
  },

  async updateTicket(
    id: string,
    data: Partial<TicketRegistrationFormType>,
    updatedBy: string
  ): Promise<void> {
    const existingTicket = (await fetchFromDatabase<Ticket>(
      `tickets/${id}`,
      undefined,
      true
    )) as Ticket
    if (!existingTicket) throw new Error('Ticket não encontrado')

    // Validar participantes, se fornecidos
    if (data.participants) {
      const user = (await fetchFromDatabase<User>(
        `users/${updatedBy}`,
        undefined,
        true
      )) as User
      if (!user) throw new Error('Usuário não encontrado')
      await validateParticipants(data.participants, updatedBy, user.role)
    }

    const updatedTicket: Ticket = {
      ...existingTicket,
      title: data.title ?? existingTicket.title,
      description: data.description ?? existingTicket.description,
      participants: data.participants ?? existingTicket.participants,
      relatedDemandId:
        data.relatedDemandId !== undefined
          ? data.relatedDemandId
          : existingTicket.relatedDemandId,
      relatedEventId:
        data.relatedEventId !== undefined
          ? data.relatedEventId
          : existingTicket.relatedEventId,
      lastUpdatedAt: new Date().toISOString()
    }

    try {
      await saveToDatabase('tickets', updatedTicket)
    } catch (error) {
      throw new Error(`Falha ao atualizar ticket: ${error}`)
    }
  },

  async updateTicketStatus(
    id: string,
    status: TicketStatus,
    updatedBy: string
  ): Promise<void> {
    const existingTicket = (await fetchFromDatabase<Ticket>(
      `tickets/${id}`,
      undefined,
      true
    )) as Ticket
    if (!existingTicket) throw new Error('Ticket não encontrado')

    const updatedTicket: Ticket = {
      ...existingTicket,
      status,
      lastUpdatedAt: new Date().toISOString()
    }

    try {
      await saveToDatabase('tickets', updatedTicket)
    } catch (error) {
      throw new Error(`Falha ao atualizar status do ticket: ${error}`)
    }
  },

  async deleteTicket(id: string): Promise<void> {
    const ticket = (await fetchFromDatabase<Ticket>(
      `tickets/${id}`,
      undefined,
      true
    )) as Ticket
    if (!ticket) throw new Error('Ticket não encontrado')

    if (ticket?.messages?.some((msg) => msg.attachments)) {
      try {
        await deleteFilesFromStorage(`tickets/${id}/messages`)
      } catch (error) {
        throw new Error(`Falha ao excluir arquivos no Storage: ${error}`)
      }
    }

    await deleteFromDatabase(`tickets/${id}`)
    console.log(id)
  },

  async sendMessage(
    ticketId: string,
    senderId: string,
    content: string,
    attachments?: RcFile[]
  ): Promise<string> {
    const ticket = (await fetchFromDatabase<Ticket>(
      `tickets/${ticketId}`,
      undefined,
      true
    )) as Ticket
    if (!ticket) throw new Error('Ticket não encontrado')

    if (!ticket.participants.includes(senderId)) {
      throw new Error('Você não é um participante deste ticket')
    }

    const storagePath = `tickets/${ticketId}/messages`
    let attachmentUrls: string[] = []
    if (attachments && attachments.length > 0) {
      attachmentUrls = await uploadFilesToStorage(storagePath, attachments)
    }

    const newMessageId = push(ref(db, `tickets/${ticketId}/messages`)).key!
    const newMessage: Message = {
      id: newMessageId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      status: MessageStatus.ENVIADA,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      readBy: [senderId]
    }

    // console.log(newMessageId)

    try {
      await saveToDatabase(`tickets/${ticketId}/messages`, newMessage)

      // Atualizar o timestamp do ticket
      const updatedTicket: Ticket = {
        ...ticket,
        lastUpdatedAt: new Date().toISOString()
      }
      await saveToDatabase('tickets', updatedTicket)

    console.log(newMessageId)


      return newMessageId
    } catch (error) {
      if (attachmentUrls.length > 0) {
        await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
          console.warn('Erro ao limpar arquivos após falha:', cleanupError)
        )
      }
      throw new Error(`Falha ao enviar mensagem: ${error}`)
    }
  },

  async markMessageAsRead(
    ticketId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const message = (await fetchFromDatabase<Message>(
      `tickets/${ticketId}/messages/${messageId}`,
      undefined,
      true
    )) as Message
    if (!message) throw new Error('Mensagem não encontrada')

    if (!message.readBy?.includes(userId)) {
      const updatedMessage: Message = {
        ...message,
        readBy: [...(message.readBy || []), userId],
        status: MessageStatus.LIDA
      }
      try {
        await saveToDatabase(`tickets/${ticketId}/messages`, updatedMessage)
      } catch (error) {
        throw new Error(`Falha ao marcar mensagem como lida: ${error}`)
      }
    }
  },

  async fetchTickets(filters: Partial<TicketFilters>): Promise<Ticket[]> {
    const tickets = (await fetchFromDatabase<Ticket>(
      'tickets',
      filters?.cityId ? { key: 'cityId', value: filters.cityId } : undefined
    )) as Ticket[]

    return tickets.filter((ticket) => {
      return (
        (!filters.participantId ||
          ticket.participants.includes(filters.participantId)) &&
        (!filters.status || ticket.status === filters.status) &&
        (!filters.createdBy || ticket.createdBy === filters.createdBy) &&
        (!filters.relatedDemandId ||
          ticket.relatedDemandId === filters.relatedDemandId) &&
        (!filters.relatedEventId ||
          ticket.relatedEventId === filters.relatedEventId)
      )
    })
  },

  async fetchTicketById(id: string): Promise<Ticket | null> {
    try {
      const ticket = (await fetchFromDatabase<Ticket>(
        `tickets/${id}`,
        undefined,
        true
      )) as Ticket
      return ticket
    } catch {
      return null
    }
  }
}
