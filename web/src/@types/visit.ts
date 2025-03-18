// src/@types/visit.ts

import * as yup from 'yup'
import { UploadFile } from 'antd/lib/upload/interface' // Importa a tipagem do Ant Design

export enum VisitStatus {
  AGENDADA = 'agendada',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada'
}

export interface FormattedVisitTag {
  label: string
  color: string
}

export const getVisitStatusData = (status?: VisitStatus): FormattedVisitTag => {
  switch (status) {
    case VisitStatus.AGENDADA:
      return { label: 'Agendada', color: '#FFA500' }
    case VisitStatus.CONCLUIDA:
      return { label: 'Concluída', color: '#2E8B57' }
    case VisitStatus.CANCELADA:
      return { label: 'Cancelada', color: '#808080' }
    default:
      return { label: 'Desconhecido', color: '#808080' }
  }
}

interface BaseVisit {
  id: string
  voterId: string
  dateTime: string // ISO 8601 (ex.: "2025-03-15T00:00:00Z")
  createdAt: string // ISO 8601 (ex.: "2025-03-15T00:00:00Z")
  createdBy: string // ID do usuário criador
  status: VisitStatus
}

export interface VisitDetails {
  reason: string
  relatedUserId: string
  documents?: string[] | null // URLs dos documentos no Storage
  observations?: string | null
}

export interface Visit extends BaseVisit {
  details: VisitDetails
}

export interface IVisitRegistrationForm {
  voterId: string
  dateTime: string // Formato DD/MM/YYYY HH:mm para o formulário
  status: VisitStatus
  reason: string
  relatedUserId: string
  documents?: File[] | null // Arquivos enviados no formulário
  observations?: string | null
}

// Tipo ajustado para suportar UploadFile no contexto de edição/visualização
export type VisitRegistrationFormType = {
  voterId: string
  dateTime: string
  status: VisitStatus
  reason: string
  relatedUserId: string
  documents?: UploadFile[] | null // Usamos UploadFile para compatibilidade com Ant Design
  observations?: string | null
}

export const getVisitRegistrationSchema = (mode: 'create' | 'edit') => {
  return yup.object().shape({
    voterId: yup.string().when(mode, {
      is: (value: string) => value === 'create',
      then: () => yup.string().required('Eleitor é obrigatório'),
      otherwise: () => yup.string().notRequired()
    }),
    dateTime: yup.string().when(mode, {
      is: (value: string) => value === 'create',
      then: () =>
        yup
          .string()
          .required('Data e horário são obrigatórios')
          .matches(
            /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/,
            'Formato inválido. Use DD/MM/YYYY HH:mm'
          ),
      otherwise: () =>
        yup
          .string()
          .matches(
            /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/,
            'Formato inválido. Use DD/MM/YYYY HH:mm'
          )
          .notRequired()
    }),
    status: yup
      .string()
      .required('Status é obrigatório')
      .oneOf(Object.values(VisitStatus), 'Selecione um status válido'),
    reason: yup.string().required('Motivo é obrigatório'),
    relatedUserId: yup.string().required('Usuário vinculado é obrigatório'),
    documents: yup.array().of(yup.mixed<UploadFile>()).nullable().optional(), // Ajustado para UploadFile
    observations: yup.string().nullable().optional()
  })
}

export type VisitRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getVisitRegistrationSchema>
>
