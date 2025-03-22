// src/@types/segment.ts

import * as yup from 'yup'
import { DemandStatus } from '@/@types/demand'
import { User } from '@/@types/user'

export interface SegmentFilters {
  bairro?: string
  idadeMin?: number
  idadeMax?: number
  demandStatus?: DemandStatus[]
}

export interface Segment {
  id: string
  name: string
  filters: SegmentFilters
  createdAt: string
  createdBy: string
  cityId: string
  voters: string[] // IDs dos eleitores que correspondem aos filtros
}

export interface SegmentRegistrationFormType {
  name: string
  bairro?: string
  idadeMin?: number
  idadeMax?: number
  demandStatus?: DemandStatus[]
  cityId?: string
}

export const getSegmentRegistrationSchema = () => {
  return yup.object().shape({
    name: yup.string().required('Nome do segmento é obrigatório'),
    bairro: yup.string().optional(),
    idadeMin: yup
      .number()
      .min(18, 'Idade mínima deve ser pelo menos 18 anos')
      .optional(),
    idadeMax: yup
      .number()
      .max(100, 'Idade máxima deve ser no máximo 100 anos')
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
    cityId: yup.string().optional()
  })
}

export type SegmentRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getSegmentRegistrationSchema>
>
