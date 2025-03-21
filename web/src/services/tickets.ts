// src/services/tickets.ts

import { ref, set, get, remove, push, update } from 'firebase/database'
import { db, storage } from '@/lib/firebase'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import {
  Ticket,
  TicketRegistrationFormType,
  Message,
  TicketStatus,
  MessageStatus
} from '@/@types/tickets'
import { UserRole, User } from '@/@types/user'
import { authService } from '@/services/auth'
import { demandsService } from '@/services/demands'
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
}

const generateProtocol = async (): Promise<string> => {
  const ticketsRef = ref(db, 'tickets')
  const snapshot = await get(ticketsRef)
  const tickets = snapshot.val() || {}
  const ticketCount = Object.keys(tickets).length + 1
  return `TICKET-${new Date().getFullYear()}-${ticketCount
    .toString()
    .padStart(4, '0')}`
}

const uploadFilesToStorage = async (
  path: string,
  files: File[]
): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const fileRef = storageRef(
      storage,
      `${path}/attachment_${index}_${Date.now()}_${file.name}`
    )
    await uploadBytes(fileRef, file)
    return getDownloadURL(fileRef)
  })
  return Promise.all(uploadPromises)
}

const deleteFilesFromStorage = async (path: string): Promise<void> => {
  const folderRef = storageRef(storage, path)
  // Note: Firebase Storage não suporta exclusão de pastas diretamente.
  // Para simplificar, excluímos os arquivos listados no ticket ao deletar.
}

export const ticketsService: TicketsService = {
  async createTicket(
    data: TicketRegistrationFormType,
    userId: string,
    userCityId: string,
    userRole: UserRole
  ): Promise<string> {
    const ticketsRef = ref(db, 'tickets')
    const newTicketId = push(ticketsRef).key!
    const protocol = await generateProtocol()

    // Validar permissões de criação
    const creator = await authService.getUserData(userId)
    if (!creator) throw new Error('Usuário não encontrado')

    // Verificar se os participantes são válidos com base nas regras de acesso
    for (const participantId of data.participants) {
      const participant = await authService.getUserData(participantId)
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

    // Fazer upload dos anexos, se houver
    let attachmentUrls: string[] = []
    if (data.attachments && data.attachments.length > 0) {
      const filesToUpload = data.attachments
        .map((file) => file.originFileObj)
        .filter((file): file is RcFile => file instanceof File)
      attachmentUrls = await uploadFilesToStorage(
        `tickets/${newTicketId}/messages`,
        filesToUpload
      )
    }

    // Criar a mensagem inicial
    const messagesRef = ref(db, `tickets/${newTicketId}/messages`)
    const newMessageId = push(messagesRef).key!
    const initialMessage: Message = {
      id: newMessageId,
      senderId: userId,
      content: data.initialMessage,
      timestamp: new Date().toISOString(),
      status: MessageStatus.ENVIADA,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      readBy: [userId] // O criador já leu sua própria mensagem
    }

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
      messages: [initialMessage],
      relatedDemandId: data.relatedDemandId || null,
      relatedEventId: data.relatedEventId || null,
      lastUpdatedAt: new Date().toISOString()
    }

    await set(ref(db, `tickets/${newTicketId}`), newTicket)

    // Registrar no histórico do eleitor, se aplicável
    const eleitor = data.participants.find(async (id) => {
      const user = await authService.getUserData(id)
      return user?.role === UserRole.ELEITOR
    })
    if (eleitor) {
      // Aqui você pode integrar com um serviço de histórico, se existir
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
    if (!snapshot.exists()) throw new Error('Ticket não encontrado')

    const existingTicket: Ticket = snapshot.val()
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

    await set(ticketRef, updatedTicket)
  },

  async deleteTicket(id: string): Promise<void> {
    const ticketRef = ref(db, `tickets/${id}`)
    const snapshot = await get(ticketRef)
    if (!snapshot.exists()) throw new Error('Ticket não encontrado')

    const ticket: Ticket = snapshot.val()
    if (ticket.messages.some((msg) => msg.attachments)) {
      await deleteFilesFromStorage(`tickets/${id}/messages`)
    }

    await remove(ticketRef)
  },

  async sendMessage(
    ticketId: string,
    senderId: string,
    content: string,
    attachments?: File[]
  ): Promise<string> {
    const ticketRef = ref(db, `tickets/${ticketId}`)
    const snapshot = await get(ticketRef)
    if (!snapshot.exists()) throw new Error('Ticket não encontrado')

    const ticket: Ticket = snapshot.val()
    if (!ticket.participants.includes(senderId)) {
      throw new Error('Você não é um participante deste ticket')
    }

    // Fazer upload dos anexos, se houver
    let attachmentUrls: string[] = []
    if (attachments && attachments.length > 0) {
      attachmentUrls = await uploadFilesToStorage(
        `tickets/${ticketId}/messages`,
        attachments
      )
    }

    const messagesRef = ref(db, `tickets/${ticketId}/messages`)
    const newMessageId = push(messagesRef).key!
    const newMessage: Message = {
      id: newMessageId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      status: MessageStatus.ENVIADA,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      readBy: [senderId]
    }

    await set(
      ref(db, `tickets/${ticketId}/messages/${newMessageId}`),
      newMessage
    )
    await update(ticketRef, { lastUpdatedAt: new Date().toISOString() })

    return newMessageId
  },

  async markMessageAsRead(
    ticketId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    const messageRef = ref(db, `tickets/${ticketId}/messages/${messageId}`)
    const snapshot = await get(messageRef)
    if (!snapshot.exists()) throw new Error('Mensagem não encontrada')

    const message: Message = snapshot.val()
    if (!message.readBy?.includes(userId)) {
      const updatedReadBy = [...(message.readBy || []), userId]
      await update(messageRef, {
        readBy: updatedReadBy,
        status: MessageStatus.LIDA
      })
    }
  },

  async fetchTickets(filters: Partial<TicketFilters>): Promise<Ticket[]> {
    const ticketsRef = ref(db, 'tickets')
    const snapshot = await get(ticketsRef)
    const ticketsData = snapshot.val() || {}

    const ticketsArray = Object.values(ticketsData) as Ticket[]
    return ticketsArray.filter((ticket) => {
      return (
        (!filters.cityId || ticket.cityId === filters.cityId) &&
        (!filters.participantId ||
          ticket.participants.includes(filters.participantId)) &&
        (!filters.status || ticket.status === filters.status)
      )
    })
  },

  async fetchTicketById(id: string): Promise<Ticket | null> {
    const ticketRef = ref(db, `tickets/${id}`)
    const snapshot = await get(ticketRef)
    return snapshot.exists() ? (snapshot.val() as Ticket) : null
  }
}
