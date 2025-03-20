// src/@types/visit.ts

import * as yup from 'yup'
import { UploadFile } from 'antd/lib/upload/interface'

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
  cityId: string
  dateTime: string
  createdAt: string
  createdBy: string
  status: VisitStatus
}

export interface VisitDetails {
  reason: string
  relatedUserId: string
  documents?: string[] | null
  observations?: string | null
}

export interface Visit extends BaseVisit {
  details: VisitDetails
}

export interface VisitRegistrationFormType {
  voterId: string
  cityId?: string
  dateTime: string
  status: VisitStatus
  reason: string
  relatedUserId: string
  documents?: UploadFile[] | null
  observations?: string | null
}

export const getVisitRegistrationSchema = (mode: 'create' | 'edit') => {
  return yup.object().shape({
    voterId: yup.string().when('mode', {
      is: () => mode === 'create',
      then: () => yup.string().required('Eleitor é obrigatório'),
      otherwise: () => yup.string().notRequired()
    }),
    cityId: yup.string().optional(),
    dateTime: yup.string().when('mode', {
      is: () => mode === 'create',
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
    documents: yup.array().of(yup.mixed<UploadFile>()).nullable().optional(),
    observations: yup.string().nullable().optional()
  })
}

export type VisitRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getVisitRegistrationSchema>
>
