// src/@types/city.ts

import { citiesService } from '@/services/cities'
import * as yup from 'yup'

export interface FormattedCityTag {
  label: string
  color: string
}

export enum CityStatus {
  ATIVA = 'ativa',
  INATIVA = 'inativa',
  PENDENTE = 'pendente'
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
  status: CityStatus
  createdAt: string
  updatedAt: string
}

export interface CityDetails {
  description?: string | null
  totalUsers: number
  population?: number | null
  area?: number | null // em km²
  cepRangeStart?: string | null
  cepRangeEnd?: string | null
  state: string // Apenas as iniciais do estado (ex.: "SP")
}

export interface City extends BaseCity {
  details: CityDetails
}

export interface CityRegistrationForm {
  name: string
  status: CityStatus
  description?: string | null
  totalUsers?: number
  population?: number | null
  area?: number | null
  cepRangeStart?: string | null
  cepRangeEnd?: string | null
  state: string
}

export const getCityRegistrationSchema = (mode: 'create' | 'edit') => {
  return yup.object().shape({
    name: yup
      .string()
      .required('Nome da cidade é obrigatório')
      .test('unique-name', 'Esta cidade já está registrada', async (value) => {
        if (!value) return false
        return await citiesService.checkCityNameUniqueness(value)
      }),
    status: yup
      .string()
      .required('Status é obrigatório')
      .oneOf(Object.values(CityStatus), 'Selecione um status válido'),
    description: yup.string().nullable().optional(),
    totalUsers: yup
      .number()
      .integer('Deve ser um número inteiro')
      .min(0, 'Não pode ser negativo')
      .optional()
      .default(0),
    population: yup
      .number()
      .integer('Deve ser um número inteiro')
      .min(0, 'Não pode ser negativo')
      .nullable()
      .optional(),
    area: yup.number().min(0, 'Não pode ser negativo').nullable().optional(),
    cepRangeStart: yup
      .string()
      .matches(/^\d{5}-\d{3}$/, {
        message: 'CEP deve estar no formato 00000-000',
        excludeEmptyString: true
      })
      .nullable()
      .optional(),
    cepRangeEnd: yup
      .string()
      .matches(/^\d{5}-\d{3}$/, {
        message: 'CEP deve estar no formato 00000-000',
        excludeEmptyString: true
      })
      .nullable()
      .optional()
      .test(
        'cep-range-valid',
        'O CEP final deve ser maior ou igual ao inicial',
        function (value) {
          const cepStart = this.parent.cepRangeStart
          if (!cepStart || !value) return true
          return value >= cepStart
        }
      ),
    state: yup
      .string()
      .required('Estado é obrigatório')
      .length(2, 'O estado deve ter 2 caracteres (ex.: SP)')
  })
}

export type CityRegistrationFormType = yup.InferType<
  ReturnType<typeof getCityRegistrationSchema>
>
