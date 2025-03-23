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

// Interface para uma resposta a uma pergunta
export interface PollAnswer {
  questionId: string
  value: string // Pode ser a opção selecionada, texto, número (rating) ou "Sim"/"Não"
}

// Interface para uma resposta completa de um usuário
export interface PollResponse {
  id: string
  pollId: string
  userId: string
  answers: PollAnswer[]
  submittedAt: string
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

// Interface para o formulário de resposta
export interface PollResponseFormType {
  answers: PollAnswer[]
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

// Schema de validação para o formulário de resposta
export const getPollResponseSchema = (questions: PollQuestion[]) => {
  return yup.object().shape({
    answers: yup
      .array()
      .of(
        yup.object().shape({
          questionId: yup.string().required(),
          value: yup.string().when('questionId', {
            is: (questionId: string) => {
              const question = questions.find((q) => q.id === questionId)
              if (!question) return false
              return question.isRequired
            },
            then: (schema) =>
              schema
                .required('Este campo é obrigatório')
                .test(
                  'valid-value',
                  'Valor inválido para a pergunta',
                  function (value) {
                    const question = questions.find(
                      (q) => q.id === this.parent.questionId
                    )
                    if (!question) return true

                    if (question.type === PollQuestionType.MULTIPLE_CHOICE) {
                      return (
                        question.options?.some(
                          (option) => option.value === value
                        ) || false
                      )
                    }
                    if (question.type === PollQuestionType.TEXT) {
                      return (
                        !question.maxLength ||
                        value.length <= question.maxLength
                      )
                    }
                    if (question.type === PollQuestionType.RATING) {
                      const numValue = Number(value)
                      return (
                        !isNaN(numValue) &&
                        numValue >= 1 &&
                        numValue <= (question.ratingScale || 5)
                      )
                    }
                    if (question.type === PollQuestionType.YES_NO) {
                      return value === 'Sim' || value === 'Não'
                    }
                    return true
                  }
                ),
            otherwise: (schema) =>
              schema.test(
                'valid-value',
                'Valor inválido para a pergunta',
                function (value) {
                  if (!value) return true // Campo não preenchido é válido se não for obrigatório
                  const question = questions.find(
                    (q) => q.id === this.parent.questionId
                  )
                  if (!question) return true

                  if (question.type === PollQuestionType.MULTIPLE_CHOICE) {
                    return (
                      question.options?.some(
                        (option) => option.value === value
                      ) || false
                    )
                  }
                  if (question.type === PollQuestionType.TEXT) {
                    return (
                      !question.maxLength || value.length <= question.maxLength
                    )
                  }
                  if (question.type === PollQuestionType.RATING) {
                    const numValue = Number(value)
                    return (
                      !isNaN(numValue) &&
                      numValue >= 1 &&
                      numValue <= (question.ratingScale || 5)
                    )
                  }
                  if (question.type === PollQuestionType.YES_NO) {
                    return value === 'Sim' || value === 'Não'
                  }
                  return true
                }
              )
          })
        })
      )
      .required()
      .test(
        'match-questions',
        'Todas as perguntas obrigatórias devem ser respondidas',
        (answers) => {
          const requiredQuestionIds = questions
            .filter((q) => q.isRequired)
            .map((q) => q.id)
          return requiredQuestionIds.every((id) =>
            answers?.some((answer) => answer.questionId === id && answer.value)
          )
        }
      )
  })
}

export type PollRegistrationFormTypeSchema = yup.InferType<
  ReturnType<typeof getPollRegistrationSchema>
>

export type PollResponseFormTypeSchema = yup.InferType<
  ReturnType<typeof getPollResponseSchema>
>
