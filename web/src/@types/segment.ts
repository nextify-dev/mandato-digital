// src/@types/segment.ts

import * as yup from 'yup'
import { DemandStatus } from '@/@types/demand'
import { GENDER_OPTIONS, RELIGION_OPTIONS } from '@/data/options'

// Interface para os filtros do segmento
export interface SegmentFilters {
  bairro?: string // Filtro por bairro
  idadeMin?: number // Idade mínima
  idadeMax?: number // Idade máxima
  demandStatus?: DemandStatus[] // Status das demandas
  genero?: string[] // Gênero dos eleitores
  religiao?: string[]
  escolaridade?: string[] // Nível de escolaridade
  rendaFamiliar?: string[] // Faixa de renda familiar
  ocupacao?: string[] // Ocupação profissional
  zonaEleitoral?: string[] // Zona eleitoral
  dataCadastroInicio?: string // Data de cadastro (início)
  dataCadastroFim?: string // Data de cadastro (fim)
}

// Interface do Segmento
export interface Segment {
  id: string
  name: string
  description?: string // Descrição opcional do segmento
  filters: SegmentFilters
  createdAt: string
  updatedAt: string
  createdBy: string
  cityIds: string[]
  isActive: boolean // Indica se o segmento está ativo
  votersCount?: number // Número de eleitores que correspondem aos filtros (calculado dinamicamente)
}

// Interface para o formulário de registro de segmento
export interface SegmentRegistrationFormType {
  name: string
  description?: string
  idadeMin?: number
  idadeMax?: number
  demandStatus?: DemandStatus[]
  genero?: string[]
  religiao?: string[]
  escolaridade?: string[]
  rendaFamiliar?: string[]
  ocupacao?: string[]
  zonaEleitoral?: string[]
  dataCadastroInicio?: string
  dataCadastroFim?: string
  cityIds?: string[]
  isActive: boolean
}

// Schema de validação para o formulário
export const getSegmentRegistrationSchema = () => {
  return yup.object().shape({
    name: yup
      .string()
      .required('Nome do segmento é obrigatório')
      .min(3, 'O nome deve ter pelo menos 3 caracteres'),
    description: yup
      .string()
      .optional()
      .max(500, 'A descrição não pode ter mais de 500 caracteres'),
    idadeMin: yup
      .number()
      .min(18, 'Idade mínima deve ser pelo menos 18 anos')
      .optional(),
    idadeMax: yup
      .number()
      .max(120, 'Idade máxima deve ser no máximo 120 anos')
      .optional()
      .test(
        'idadeMax-greater-than-idadeMin',
        'Idade máxima deve ser maior que a idade mínima',
        function (value) {
          const idadeMin = this.parent.idadeMin
          if (idadeMin && value) {
            return value >= idadeMin
          }
          return true
        }
      ),
    demandStatus: yup
      .array()
      .of(yup.string().oneOf(Object.values(DemandStatus)))
      .optional(),
    genero: yup
      .array()
      .of(
        yup.string().oneOf(
          GENDER_OPTIONS.map((opt) => opt.value),
          'Selecione um gênero válido'
        )
      )
      .optional(),
    religiao: yup
      .array()
      .of(
        yup.string().oneOf(
          RELIGION_OPTIONS.map((opt) => opt.value),
          'Selecione uma religião válida'
        )
      )
      .optional(),
    escolaridade: yup.array().of(yup.string()).optional(),
    rendaFamiliar: yup.array().of(yup.string()).optional(),
    ocupacao: yup.array().of(yup.string()).optional(),
    zonaEleitoral: yup.array().of(yup.string()).optional(),
    dataCadastroInicio: yup.string().optional(),
    dataCadastroFim: yup
      .string()
      .optional()
      .test(
        'dataCadastroFim-after-dataCadastroInicio',
        'A data de cadastro final deve ser posterior à data inicial',
        function (value) {
          const dataInicio = this.parent.dataCadastroInicio
          if (dataInicio && value) {
            return new Date(value) >= new Date(dataInicio)
          }
          return true
        }
      ),
    cityIds: yup.array().optional(),
    isActive: yup.boolean().default(true)
  })
}

export type SegmentRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getSegmentRegistrationSchema>
>
