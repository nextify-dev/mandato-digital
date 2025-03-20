// src/@types/demand.ts

import * as yup from 'yup'
import { UploadFile } from 'antd/lib/upload/interface'
import { UserRole } from '@/@types/user'

export enum DemandStatus {
  NOVA = 'nova',
  EM_ANALISE = 'em_analise',
  CONCLUIDA = 'concluida'
}

export interface FormattedDemandTag {
  label: string
  color: string
}

export const getDemandStatusData = (
  status?: DemandStatus
): FormattedDemandTag => {
  switch (status) {
    case DemandStatus.NOVA:
      return { label: 'Nova', color: '#FFA500' }
    case DemandStatus.EM_ANALISE:
      return { label: 'Em Análise', color: '#1E90FF' }
    case DemandStatus.CONCLUIDA:
      return { label: 'Concluída', color: '#2E8B57' }
    default:
      return { label: 'Desconhecido', color: '#808080' }
  }
}

interface BaseDemand {
  id: string
  protocol: string
  voterId: string
  cityId: string
  description: string
  status: DemandStatus
  createdAt: string
  createdBy: string
  relatedUserId: string
}

export interface DemandUpdate {
  updatedAt: string
  updatedBy: string
  newStatus: DemandStatus
}

export interface DemandDetails {
  documents?: string[] | null
  updates?: DemandUpdate[] | null
}

export interface Demand extends BaseDemand {
  details: DemandDetails
}

export interface DemandRegistrationFormType {
  voterId: string
  cityId?: string
  description: string
  status: DemandStatus
  relatedUserId: string
  documents?: UploadFile[] | null
}

export const getDemandRegistrationSchema = (mode: 'create' | 'edit') => {
  return yup.object().shape({
    voterId: yup.string().when('mode', {
      is: () => mode === 'create',
      then: () => yup.string().required('Eleitor é obrigatório'),
      otherwise: () => yup.string().notRequired()
    }),
    cityId: yup.string().optional(),
    description: yup.string().required('Descrição da demanda é obrigatória'),
    status: yup
      .string()
      .required('Status é obrigatório')
      .oneOf(Object.values(DemandStatus), 'Selecione um status válido'),
    relatedUserId: yup.string().required('Usuário vinculado é obrigatório'),
    documents: yup.array().of(yup.mixed<UploadFile>()).nullable().optional()
  })
}

export type DemandRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getDemandRegistrationSchema>
>
