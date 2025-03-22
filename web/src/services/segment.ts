// src/services/segment.ts

import { Segment, SegmentRegistrationFormType } from '@/@types/segment'
import {
  fetchFromDatabase,
  saveToDatabase,
  deleteFromDatabase
} from '@/utils/functions/databaseUtils'

export const segmentService = {
  getSegments: async (filters?: { cityId: string }): Promise<Segment[]> => {
    return fetchFromDatabase<Segment>(
      'segments',
      filters ? { key: 'cityId', value: filters.cityId } : undefined
    ) as Promise<Segment[]>
  },

  createSegment: async (
    data: SegmentRegistrationFormType,
    userId: string,
    userCityId: string
  ): Promise<string> => {
    const newSegmentId = `segment_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const newSegment: Segment = {
      id: newSegmentId,
      name: data.name,
      filters: {
        bairro: data.bairro,
        idadeMin: data.idadeMin,
        idadeMax: data.idadeMax,
        demandStatus: data.demandStatus
      },
      createdAt: new Date().toISOString(),
      createdBy: userId,
      cityId: data.cityId || userCityId,
      voters: [] // Será preenchido dinamicamente na view
    }

    await saveToDatabase('segments', newSegment)
    return newSegmentId
  },

  updateSegment: async (
    id: string,
    data: Partial<SegmentRegistrationFormType>
  ): Promise<void> => {
    const existingSegment = (await fetchFromDatabase<Segment>(
      `segments/${id}`,
      undefined,
      true
    )) as Segment

    if (!existingSegment) {
      throw new Error('Segmento não encontrado')
    }

    const updatedSegment: Segment = {
      ...existingSegment,
      name: data.name ?? existingSegment.name,
      filters: {
        bairro: data.bairro ?? existingSegment.filters.bairro,
        idadeMin: data.idadeMin ?? existingSegment.filters.idadeMin,
        idadeMax: data.idadeMax ?? existingSegment.filters.idadeMax,
        demandStatus: data.demandStatus ?? existingSegment.filters.demandStatus
      },
      cityId: data.cityId ?? existingSegment.cityId
    }

    await saveToDatabase('segments', updatedSegment)
  },

  deleteSegment: async (id: string): Promise<void> => {
    await deleteFromDatabase(`segments/${id}`)
  }
}
