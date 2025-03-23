// src/services/pollService.ts

import { Poll, PollRegistrationFormType } from '@/@types/poll'
import { Segment } from '@/@types/segment'
import {
  fetchFromDatabase,
  saveToDatabase,
  deleteFromDatabase
} from '@/utils/functions/databaseUtils'

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
      responseCount: 0 // Será preenchido dinamicamente
    }

    await saveToDatabase('polls', newPoll)
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
      isActive: data.isActive ?? existingPoll.isActive
    }

    await saveToDatabase('polls', updatedPoll)
  },

  deletePoll: async (id: string): Promise<void> => {
    await deleteFromDatabase(`polls/${id}`)
  }
}
