// src/services/pollService.ts

import {
  Poll,
  PollRegistrationFormType,
  PollQuestionType,
  PollResponse,
  PollResponseFormType
} from '@/@types/poll'
import { Segment } from '@/@types/segment'
import {
  fetchFromDatabase,
  saveToDatabase,
  deleteFromDatabase,
  updateFieldInDatabase
} from '@/utils/functions/databaseUtils'

// Função auxiliar para limpar valores undefined e formatar o objeto Poll
const cleanPollData = (poll: Poll): Poll => {
  const cleanedPoll: Poll = { ...poll }

  // Limpar campos undefined no nível do Poll
  if (cleanedPoll.description === undefined) {
    delete cleanedPoll.description
  }
  if (cleanedPoll.responseCount === undefined) {
    delete cleanedPoll.responseCount
  }

  // Limpar e formatar as perguntas
  cleanedPoll.questions = cleanedPoll.questions.map((question) => {
    const cleanedQuestion: any = { ...question }

    // Garantir que options só exista para perguntas do tipo MULTIPLE_CHOICE
    if (question.type !== PollQuestionType.MULTIPLE_CHOICE) {
      delete cleanedQuestion.options
    } else {
      // Filtrar opções vazias ou inválidas e remover undefined
      cleanedQuestion.options = (question.options || [])
        .filter((option) => option.value && option.value.trim() !== '')
        .map((option) => ({
          id: option.id,
          value: option.value.trim()
        }))
    }

    // Garantir que maxLength só exista para perguntas do tipo TEXT
    if (question.type !== PollQuestionType.TEXT) {
      delete cleanedQuestion.maxLength
    }

    // Garantir que ratingScale só exista para perguntas do tipo RATING
    if (question.type !== PollQuestionType.RATING) {
      delete cleanedQuestion.ratingScale
    }

    return cleanedQuestion
  })

  return cleanedPoll
}

// Função auxiliar para limpar valores undefined e formatar o objeto PollResponse
const cleanPollResponseData = (response: PollResponse): PollResponse => {
  const cleanedResponse: PollResponse = { ...response }

  // Filtrar respostas vazias ou inválidas
  cleanedResponse.answers = cleanedResponse.answers
    .filter((answer) => answer.value && answer.value.trim() !== '')
    .map((answer) => ({
      questionId: answer.questionId,
      value: answer.value.trim()
    }))

  return cleanedResponse
}

export const pollService = {
  getPolls: async (filters?: { createdBy: string }): Promise<Poll[]> => {
    return fetchFromDatabase<Poll>(
      'polls',
      filters ? { key: 'createdBy', value: filters.createdBy } : undefined
    ) as Promise<Poll[]>
  },

  createPoll: async (
    data: PollRegistrationFormType,
    userId: string,
    segment: Segment
  ): Promise<string> => {
    const newPollId = `poll_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const currentDate = new Date().toISOString()
    const newPoll: Poll = {
      id: newPollId,
      title: data.title,
      description: data.description,
      segmentId: data.segmentId,
      questions: data.questions,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: userId,
      cityIds: segment.cityIds, // Herdado do segmento
      isActive: data.isActive ?? true,
      responseCount: 0 // Inicializa com 0
    }

    // Limpar o objeto antes de salvar
    const cleanedPoll = cleanPollData(newPoll)

    await saveToDatabase('polls', cleanedPoll)
    return newPollId
  },

  updatePoll: async (
    id: string,
    data: Partial<PollRegistrationFormType>
  ): Promise<void> => {
    const existingPoll = (await fetchFromDatabase<Poll>(
      `polls/${id}`,
      undefined,
      true
    )) as Poll

    if (!existingPoll) {
      throw new Error('Enquete não encontrada')
    }

    const updatedPoll: Poll = {
      ...existingPoll,
      title: data.title ?? existingPoll.title,
      description: data.description ?? existingPoll.description,
      segmentId: data.segmentId ?? existingPoll.segmentId,
      questions: data.questions ?? existingPoll.questions,
      updatedAt: new Date().toISOString(),
      cityIds: data.cityIds ?? existingPoll.cityIds,
      isActive: data.isActive ?? existingPoll.isActive,
      responseCount: existingPoll.responseCount // Mantém o valor existente
    }

    // Limpar o objeto antes de salvar
    const cleanedPoll = cleanPollData(updatedPoll)

    await saveToDatabase('polls', cleanedPoll)
  },

  deletePoll: async (id: string): Promise<void> => {
    // Deletar a enquete
    await deleteFromDatabase(`polls/${id}`)
    // Deletar todas as respostas associadas
    await deleteFromDatabase(`pollResponses/${id}`)
  },

  submitResponse: async (
    pollId: string,
    userId: string,
    response: PollResponseFormType
  ): Promise<void> => {
    const existingPoll = (await fetchFromDatabase<Poll>(
      `polls/${pollId}`,
      undefined,
      true
    )) as Poll

    if (!existingPoll) {
      throw new Error('Enquete não encontrada')
    }

    const responseId = `response_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const currentDate = new Date().toISOString()
    const newResponse: PollResponse = {
      id: responseId,
      pollId,
      userId,
      answers: response.answers,
      submittedAt: currentDate
    }

    // Limpar o objeto antes de salvar
    const cleanedResponse = cleanPollResponseData(newResponse)

    // Salvar a resposta diretamente no caminho correto
    await saveToDatabase(`pollResponses/${pollId}`, cleanedResponse)

    // Atualizar o responseCount da enquete
    const newResponseCount = (existingPoll.responseCount || 0) + 1
    await updateFieldInDatabase(
      `polls/${pollId}`,
      'responseCount',
      newResponseCount
    )
  },

  getResponses: async (pollId: string): Promise<PollResponse[]> => {
    return (await fetchFromDatabase<PollResponse>(
      `pollResponses/${pollId}`
    )) as PollResponse[]
  }
}
