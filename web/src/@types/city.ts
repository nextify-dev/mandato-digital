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
  totalVoters?: number | null // Número de eleitores (opcional)
  population?: number | null // População (opcional)
  ibgeCode?: number | null // Código IBGE (opcional)
  cepRangeStart?: string | null // CEP inicial (opcional)
  cepRangeEnd?: string | null // CEP final (opcional)
  observations?: string | null // Observações (opcional)
}

export interface City extends BaseCity {
  details: CityDetails
}

export interface CityRegistrationForm {
  name: string
  state: string
  status: CityStatus
  totalVoters?: number | null
  population?: number | null
  ibgeCode?: number | null
  cepRangeStart?: string | null
  cepRangeEnd?: string | null
  observations?: string | null
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
    state: yup
      .string()
      .required('Estado é obrigatório')
      .length(2, 'O estado deve ter 2 caracteres (ex.: SP)'),
    status: yup
      .string()
      .required('Status é obrigatório')
      .oneOf(Object.values(CityStatus), 'Selecione um status válido'),
    totalVoters: yup
      .number()
      .integer('Deve ser um número inteiro')
      .min(0, 'Não pode ser negativo')
      .nullable()
      .optional(),
    population: yup
      .number()
      .integer('Deve ser um número inteiro')
      .min(0, 'Não pode ser negativo')
      .nullable()
      .optional(),
    ibgeCode: yup
      .number()
      .integer('Deve ser um número inteiro')
      .min(0, 'Não pode ser negativo')
      .nullable()
      .optional(),
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
    observations: yup.string().nullable().optional()
  })
}

export type CityRegistrationFormType = yup.InferType<
  ReturnType<typeof getCityRegistrationSchema>
>
