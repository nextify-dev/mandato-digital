// src/services/tickets.ts

import { ref, push, set, get, update, remove, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import {
  Ticket,
  TicketRegistrationFormType,
  Message,
  TicketStatus,
  MessageStatus
} from '@/@types/tickets'
import { UserRole, User } from '@/@types/user'
import {
  uploadFilesToStorage,
  deleteFilesFromStorage
} from '@/utils/functions/storageUtils'
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
  listenToTickets(
    callback: (tickets: Ticket[]) => void,
    errorCallback: (error: Error) => void
  ): () => void
}

interface TicketFilters {
  cityId?: string
  participantId?: string
  status?: TicketStatus
  createdBy?: string
}

// Função auxiliar para converter mensagens de objeto para array
const convertMessagesToArray = (
  messagesObj: Record<string, Message> | null | undefined
): Message[] => {
  if (!messagesObj) return []
  return Object.keys(messagesObj).map((key) => ({
    ...messagesObj[key],
    id: key
  }))
}

const generateProtocol = async (): Promise<string> => {
  const ticketsRef = ref(db, 'tickets')
  const snapshot = await get(ticketsRef)
  const tickets = snapshot.val()
    ? Object.values(snapshot.val() as Record<string, Ticket>)
    : []
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
  const creatorRef = ref(db, `users/${userId}`)
  const creatorSnapshot = await get(creatorRef)
  const creator = creatorSnapshot.val() as User
  if (!creator) throw new Error('Usuário não encontrado')

  for (const participantId of participants) {
    if (participantId === userId) continue

    const participantRef = ref(db, `users/${participantId}`)
    const participantSnapshot = await get(participantRef)
    const participant = participantSnapshot.val() as User
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
    await validateParticipants(data.participants, userId, userRole)

    const newTicketId = push(ref(db, 'tickets')).key!
    const protocol = await generateProtocol()
    const storagePath = `tickets/${newTicketId}/messages`

    // Garantir que o criador (userId) esteja na lista de participantes
    const participantsWithCreator = Array.from(
      new Set([...data.participants, userId])
    )

    const newTicket: Ticket = {
      id: newTicketId,
      protocol,
      title: data.title,
      description: data.description,
      status: TicketStatus.ABERTO,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      cityId: data.cityId || userCityId,
      participants: participantsWithCreator,
      messages: [],
      lastUpdatedAt: new Date().toISOString()
    }

    const ticketRef = ref(db, `tickets/${newTicketId}`)
    try {
      await set(ticketRef, newTicket)
    } catch (error) {
      throw new Error(`Falha ao criar ticket: ${error}`)
    }

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

      const messageRef = ref(
        db,
        `tickets/${newTicketId}/messages/${newMessage.id}`
      )
      try {
        await set(messageRef, newMessage)
      } catch (error) {
        if (attachmentUrls.length > 0) {
          await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
            console.warn('Erro ao limpar arquivos após falha:', cleanupError)
          )
        }
        throw new Error(`Falha ao salvar mensagem inicial: ${error}`)
      }
    }

    const eleitor = await Promise.all(
      data.participants.map(async (id) => {
        const userRef = ref(db, `users/${id}`)
        const userSnapshot = await get(userRef)
        const user = userSnapshot.val() as User
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
    const ticketRef = ref(db, `tickets/${id}`)
    const snapshot = await get(ticketRef)
    const existingTicket = snapshot.val() as Ticket
    if (!existingTicket) throw new Error('Ticket não encontrado')

    if (data.participants) {
      const userRef = ref(db, `users/${updatedBy}`)
      const userSnapshot = await get(userRef)
      const user = userSnapshot.val() as User
      if (!user) throw new Error('Usuário não encontrado')
      await validateParticipants(data.participants, updatedBy, user.role)
    }

    const updates: Partial<Ticket> = {
      title: data.title ?? existingTicket.title,
      description: data.description ?? existingTicket.description,
      participants: data.participants ?? existingTicket.participants,
      lastUpdatedAt: new Date().toISOString()
    }

    try {
      await update(ticketRef, updates)
    } catch (error) {
      throw new Error(`Falha ao atualizar ticket: ${error}`)
    }
  },

  async updateTicketStatus(
    id: string,
    status: TicketStatus,
    updatedBy: string
  ): Promise<void> {
    const ticketRef = ref(db, `tickets/${id}`)
    const snapshot = await get(ticketRef)
    const existingTicket = snapshot.val() as Ticket
    if (!existingTicket) throw new Error('Ticket não encontrado')

    const updates: Partial<Ticket> = {
      status,
      lastUpdatedAt: new Date().toISOString()
    }

    try {
      await update(ticketRef, updates)
    } catch (error) {
      throw new Error(`Falha ao atualizar status do ticket: ${error}`)
    }
  },

  async deleteTicket(id: string): Promise<void> {
    const ticketRef = ref(db, `tickets/${id}`)
    const snapshot = await get(ticketRef)
    const ticket = snapshot.val() as Ticket
    if (!ticket) throw new Error('Ticket não encontrado')

    // Converter messages para array antes de usar 'some'
    const messagesArray = convertMessagesToArray(ticket.messages as any)
    if (messagesArray.some((msg) => msg.attachments)) {
      try {
        await deleteFilesFromStorage(`tickets/${id}/messages`)
      } catch (error) {
        throw new Error(`Falha ao excluir arquivos no Storage: ${error}`)
      }
    }

    await remove(ticketRef)
  },

  async sendMessage(
    ticketId: string,
    senderId: string,
    content: string,
    attachments?: RcFile[]
  ): Promise<string> {
    const ticketRef = ref(db, `tickets/${ticketId}`)
    const snapshot = await get(ticketRef)
    const ticket = snapshot.val() as Ticket
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

    const messageRef = ref(db, `tickets/${ticketId}/messages/${newMessageId}`)
    try {
      await set(messageRef, newMessage)

      const updates: Partial<Ticket> = {
        lastUpdatedAt: new Date().toISOString()
      }
      await update(ticketRef, updates)

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
    const messageRef = ref(db, `tickets/${ticketId}/messages/${messageId}`)
    const snapshot = await get(messageRef)
    const message = snapshot.val() as Message
    if (!message) throw new Error('Mensagem não encontrada')

    if (!message.readBy?.includes(userId)) {
      const updatedMessage: Message = {
        ...message,
        readBy: [...(message.readBy || []), userId],
        status: MessageStatus.LIDA
      }
      try {
        await set(messageRef, updatedMessage)
      } catch (error) {
        throw new Error(`Falha ao marcar mensagem como lida: ${error}`)
      }
    }
  },

  async fetchTickets(filters: Partial<TicketFilters>): Promise<Ticket[]> {
    const ticketsRef = ref(db, 'tickets')
    const snapshot = await get(ticketsRef)
    const ticketsData = snapshot.val() as Record<string, Ticket> | null
    const tickets = ticketsData
      ? Object.keys(ticketsData).map((key) => ({
          ...ticketsData[key],
          id: key,
          messages: convertMessagesToArray(ticketsData[key].messages as any)
        }))
      : []

    return tickets.filter((ticket) => {
      return (
        (!filters.cityId || ticket.cityId === filters.cityId) &&
        (!filters.participantId ||
          ticket.participants.includes(filters.participantId)) &&
        (!filters.status || ticket.status === filters.status) &&
        (!filters.createdBy || ticket.createdBy === filters.createdBy)
      )
    })
  },

  async fetchTicketById(id: string): Promise<Ticket | null> {
    try {
      const ticketRef = ref(db, `tickets/${id}`)
      const snapshot = await get(ticketRef)
      const ticket = snapshot.val() as Ticket
      if (!ticket) return null
      return {
        ...ticket,
        messages: convertMessagesToArray(ticket.messages as any)
      }
    } catch {
      return null
    }
  },

  listenToTickets(
    callback: (tickets: Ticket[]) => void,
    errorCallback: (error: Error) => void
  ): () => void {
    const ticketsRef = ref(db, 'tickets')
    const listener = onValue(
      ticketsRef,
      (snapshot) => {
        const ticketsData = snapshot.val() as Record<string, Ticket> | null
        const ticketsArray = ticketsData
          ? Object.keys(ticketsData).map((key) => ({
              ...ticketsData[key],
              id: key,
              messages: convertMessagesToArray(ticketsData[key].messages as any)
            }))
          : []
        callback(ticketsArray)
      },
      (error) => {
        errorCallback(error)
      }
    )
    return () => listener()
  }
}
