// src/@types/tickets.ts

import * as yup from 'yup'
import { UserRole, User } from '@/@types/user'
import { UploadFile } from 'antd/lib/upload/interface'

export enum TicketStatus {
  ABERTO = 'aberto',
  EM_ANDAMENTO = 'em_andamento',
  RESOLVIDO = 'resolvido',
  CANCELADO = 'cancelado'
}

export interface FormattedTicketTag {
  label: string
  color: string
}

export const getTicketStatusData = (
  status?: TicketStatus
): FormattedTicketTag => {
  switch (status) {
    case TicketStatus.ABERTO:
      return { label: 'Aberto', color: '#FFA500' }
    case TicketStatus.EM_ANDAMENTO:
      return { label: 'Em Andamento', color: '#1E90FF' }
    case TicketStatus.RESOLVIDO:
      return { label: 'Resolvido', color: '#2E8B57' }
    case TicketStatus.CANCELADO:
      return { label: 'Cancelado', color: '#808080' }
    default:
      return { label: 'Desconhecido', color: '#808080' }
  }
}

export enum MessageStatus {
  ENVIADA = 'enviada',
  LIDA = 'lida',
  FALHA = 'falha'
}

export interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string // ISO 8601
  status: MessageStatus
  attachments?: string[] | null // URLs dos anexos no Firebase Storage
  readBy?: string[] | null // IDs dos usuários que leram a mensagem
}

export interface Ticket {
  id: string
  protocol: string // Identificador único do ticket (ex.: "TICKET-2025-0001")
  title: string
  description: string
  status: TicketStatus
  createdAt: string // ISO 8601
  createdBy: string // ID do usuário que criou o ticket
  cityId: string
  participants: string[] // IDs dos usuários envolvidos (ex.: eleitor e vereador)
  messages: Message[]
  relatedDemandId?: string | null // ID da demanda associada, se houver
  relatedEventId?: string | null // ID do evento associado, se houver
  lastUpdatedAt: string // ISO 8601
}

export interface TicketRegistrationFormType {
  title: string
  description: string
  cityId?: string
  participants: string[] // IDs dos usuários envolvidos
  relatedDemandId?: string | null
  relatedEventId?: string | null
  initialMessage?: string // Mensagem inicial agora é opcional
  attachments?: UploadFile[] | null
}

export const getTicketRegistrationSchema = (mode: 'create' | 'edit') => {
  return yup.object().shape({
    title: yup.string().required('Título é obrigatório'),
    description: yup.string().required('Descrição é obrigatória'),
    cityId: yup.string().optional(),
    participants: yup
      .array()
      .of(yup.string().required())
      //   .min(2, 'Pelo menos dois participantes são necessários')
      .required('Participantes são obrigatórios'),
    relatedDemandId: yup.string().nullable().optional(),
    relatedEventId: yup.string().nullable().optional(),
    initialMessage: yup.string().optional(), // Mensagem inicial não é mais obrigatória
    attachments: yup.array().of(yup.mixed<UploadFile>()).nullable().optional()
  })
}

export type TicketRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getTicketRegistrationSchema>
>
