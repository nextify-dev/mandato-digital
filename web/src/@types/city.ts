// src/@types/city.ts
import { citiesService } from '@/services/cities'
import * as yup from 'yup'

export enum CityStatus {
  ATIVA = 'ativa',
  INATIVA = 'inativa',
  PENDENTE = 'pendente'
}

export interface FormattedCityTag {
  label: string
  color: string
}

export const getCityStatusData = (status?: CityStatus): FormattedCityTag => {
  switch (status) {
    case CityStatus.ATIVA:
      return { label: 'Ativa', color: '#2E8B57' }
    case CityStatus.INATIVA:
      return { label: 'Inativa', color: '#808080' }
    case CityStatus.PENDENTE:
      return { label: 'Pendente', color: '#FFA500' }
    default:
      return { label: 'Desconhecido', color: '#808080' }
  }
}

interface BaseCity {
  id: string
  name: string
  state: string // Sigla do estado (ex.: "SP")
  createdAt: string // ISO 8601 (ex.: "2025-03-15T00:00:00Z")
  createdBy: string // ID do usuário criador
  status: CityStatus
}

export interface CityDetails {
  totalVoters?: number | null // Calculado dinamicamente, não salvo no banco
  totalUsers?: number | null // Calculado dinamicamente, não salvo no banco
  ibgeCode: string | null
  observations: string | null
}

export interface City extends BaseCity {
  details: CityDetails
}

export interface ICityRegistrationForm {
  name: string
  state: string
  status: CityStatus
  ibgeCode?: string | null
  observations?: string | null
}

export const getCityRegistrationSchema = (mode: 'create' | 'edit') => {
  return yup.object().shape({
    name: yup.string().when(mode, {
      is: (value: string) => value === 'create',
      then: () =>
        yup
          .string()
          .required('Nome da cidade é obrigatório')
          .test(
            'unique-name',
            'Esta cidade já está registrada',
            async (value) => {
              if (!value) return false
              return await citiesService.checkCityNameUniqueness(value)
            }
          ),
      otherwise: () => yup.string().notRequired()
    }),
    state: yup.string().when(mode, {
      is: (value: string) => value === 'create',
      then: () =>
        yup
          .string()
          .required('Estado é obrigatório')
          .length(2, 'O estado deve ter 2 caracteres (ex.: SP)'),
      otherwise: () =>
        yup
          .string()
          .length(2, 'O estado deve ter 2 caracteres (ex.: SP)')
          .notRequired()
    }),
    status: yup
      .string()
      .required('Status é obrigatório')
      .oneOf(Object.values(CityStatus), 'Selecione um status válido'),
    ibgeCode: yup.string().nullable().optional(),
    observations: yup.string().nullable().optional()
  })
}

export type CityRegistrationFormType = yup.InferType<
  ReturnType<typeof getCityRegistrationSchema>
>
