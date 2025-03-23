// src/@types/poll.ts

import * as yup from 'yup'
import { Segment } from '@/@types/segment'

// Enum para os tipos de perguntas
export enum PollQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Escolha múltipla (radio ou checkbox)
  TEXT = 'TEXT', // Resposta de texto livre
  RATING = 'RATING', // Avaliação (ex.: 1 a 5 estrelas)
  YES_NO = 'YES_NO' // Sim/Não
}

// Interface para uma opção de resposta (usada em perguntas de escolha múltipla)
export interface PollQuestionOption {
  id: string
  value: string
}

// Interface para uma pergunta da enquete
export interface PollQuestion {
  id: string
  title: string
  type: PollQuestionType
  options?: PollQuestionOption[] // Opções para perguntas de escolha múltipla
  isRequired: boolean
  maxLength?: number // Para perguntas de texto
  ratingScale?: number // Para perguntas de avaliação (ex.: 5 para 1-5 estrelas)
}

// Interface para a enquete
export interface Poll {
  id: string
  title: string
  description?: string
  segmentId: string // ID do segmento associado
  questions: PollQuestion[]
  createdAt: string
  updatedAt: string
  createdBy: string
  cityIds: string[] // Cidades associadas (herdadas do segmento)
  isActive: boolean
  responseCount?: number // Número de respostas (calculado dinamicamente)
}

// Interface para o formulário de criação/edição de enquete
export interface PollRegistrationFormType {
  title: string
  description?: string
  segmentId: string
  questions: PollQuestion[]
  cityIds: string[]
  isActive: boolean
}

// Schema de validação para o formulário de enquete
export const getPollRegistrationSchema = () => {
  return yup.object().shape({
    title: yup
      .string()
      .required('Título da enquete é obrigatório')
      .min(3, 'O título deve ter pelo menos 3 caracteres')
      .max(100, 'O título não pode ter mais de 100 caracteres'),
    description: yup
      .string()
      .optional()
      .max(500, 'A descrição não pode ter mais de 500 caracteres'),
    segmentId: yup.string().required('Selecione um segmento para a enquete'),
    questions: yup
      .array()
      .of(
        yup.object().shape({
          id: yup.string().required(),
          title: yup
            .string()
            .required('O título da pergunta é obrigatório')
            .min(3, 'O título da pergunta deve ter pelo menos 3 caracteres')
            .max(
              200,
              'O título da pergunta não pode ter mais de 200 caracteres'
            ),
          type: yup
            .string()
            .oneOf(
              Object.values(PollQuestionType),
              'Selecione um tipo de pergunta válido'
            )
            .required('O tipo da pergunta é obrigatório'),
          options: yup
            .array()
            .of(
              yup.object().shape({
                id: yup.string().required(),
                value: yup
                  .string()
                  .required('A opção não pode estar vazia')
                  .max(100, 'A opção não pode ter mais de 100 caracteres')
              })
            )
            .when('type', {
              is: PollQuestionType.MULTIPLE_CHOICE,
              then: (schema) =>
                schema
                  .min(
                    2,
                    'Deve haver pelo menos 2 opções para escolha múltipla'
                  )
                  .required(
                    'Opções são obrigatórias para perguntas de escolha múltipla'
                  ),
              otherwise: (schema) => schema.optional()
            }),
          isRequired: yup.boolean().required(),
          maxLength: yup.number().when('type', {
            is: PollQuestionType.TEXT,
            then: (schema) =>
              schema
                .min(1, 'O comprimento máximo deve ser pelo menos 1')
                .max(
                  500,
                  'O comprimento máximo não pode exceder 500 caracteres'
                )
                .required(
                  'O comprimento máximo é obrigatório para perguntas de texto'
                ),
            otherwise: (schema) => schema.optional()
          }),
          ratingScale: yup.number().when('type', {
            is: PollQuestionType.RATING,
            then: (schema) =>
              schema
                .min(2, 'A escala de avaliação deve ser de pelo menos 2')
                .max(10, 'A escala de avaliação não pode exceder 10')
                .required(
                  'A escala de avaliação é obrigatória para perguntas de avaliação'
                ),
            otherwise: (schema) => schema.optional()
          })
        })
      )
      .min(1, 'A enquete deve ter pelo menos 1 pergunta')
      .required('A enquete deve ter perguntas'),
    cityIds: yup
      .array()
      .of(yup.string())
      .required(
        'As cidades serão preenchidas automaticamente com base no segmento'
      ),
    isActive: yup.boolean().default(true)
  })
}

export type PollRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getPollRegistrationSchema>
>
