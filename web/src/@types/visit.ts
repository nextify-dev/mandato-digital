// src/@types/visit.ts

import * as yup from 'yup'
import { UserRole } from '@/@types/user'

export enum VisitReason {
  REQUEST = 'Solicitação',
  COMPLAINT = 'Reclamação',
  SUPPORT = 'Apoio',
  OTHER = 'Outros'
}

export interface Visit {
  id: string
  voterId: string // ID do eleitor associado
  dateTime: string // ISO 8601
  reason: VisitReason
  relatedUserId: string // ID do vereador ou cabo eleitoral vinculado
  relatedUserRole: UserRole // Papel do usuário vinculado (ex.: Vereador, Cabo Eleitoral)
  documents?: string[] | null // URLs de documentos anexados
  createdAt: string // ISO 8601
  createdBy: string // ID do usuário que registrou
  updatedAt?: string | null // ID do usuário que registrou
  updatedBy?: string | null // ID do usuário que registrou
}

export interface VisitRegistrationForm {
  voterId: string
  dateTime: string
  reason: VisitReason
  relatedUserId: string
  documents?: File[] | null
}

export const getVisitRegistrationSchema = () => {
  return yup.object().shape({
    voterId: yup.string().required('Selecione um eleitor'),
    dateTime: yup
      .string()
      .required('Data e horário são obrigatórios')
      .matches(
        /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/,
        'Formato deve ser DD/MM/AAAA HH:MM'
      ),
    reason: yup
      .string()
      .required('Motivo é obrigatório')
      .oneOf(Object.values(VisitReason), 'Selecione um motivo válido'),
    relatedUserId: yup.string().required('Selecione um usuário vinculado'),
    documents: yup.array().of(yup.mixed()).nullable().optional()
  })
}

export type VisitRegistrationFormType = yup.InferType<
  ReturnType<typeof getVisitRegistrationSchema>
>
