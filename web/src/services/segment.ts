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
    const currentDate = new Date().toISOString()
    const newSegment: Segment = {
      id: newSegmentId,
      name: data.name,
      description: data.description,
      filters: {
        idadeMin: data.idadeMin,
        idadeMax: data.idadeMax,
        demandStatus: data.demandStatus,
        genero: data.genero,
        escolaridade: data.escolaridade,
        rendaFamiliar: data.rendaFamiliar,
        ocupacao: data.ocupacao,
        zonaEleitoral: data.zonaEleitoral,
        dataCadastroInicio: data.dataCadastroInicio,
        dataCadastroFim: data.dataCadastroFim
      },
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: userId,
      cityIds: data.cityIds || [userCityId],
      isActive: data.isActive ?? true,
      votersCount: 0 // Será preenchido dinamicamente em outros contextos
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
      description: data.description ?? existingSegment.description,
      filters: {
        idadeMin: data.idadeMin ?? existingSegment.filters.idadeMin,
        idadeMax: data.idadeMax ?? existingSegment.filters.idadeMax,
        demandStatus: data.demandStatus ?? existingSegment.filters.demandStatus,
        genero: data.genero ?? existingSegment.filters.genero,
        escolaridade: data.escolaridade ?? existingSegment.filters.escolaridade,
        rendaFamiliar:
          data.rendaFamiliar ?? existingSegment.filters.rendaFamiliar,
        ocupacao: data.ocupacao ?? existingSegment.filters.ocupacao,
        zonaEleitoral:
          data.zonaEleitoral ?? existingSegment.filters.zonaEleitoral,
        dataCadastroInicio:
          data.dataCadastroInicio ?? existingSegment.filters.dataCadastroInicio,
        dataCadastroFim:
          data.dataCadastroFim ?? existingSegment.filters.dataCadastroFim
      },
      updatedAt: new Date().toISOString(),
      cityIds: data.cityIds ?? existingSegment.cityIds,
      isActive: data.isActive ?? existingSegment.isActive
    }

    await saveToDatabase('segments', updatedSegment)
  },

  deleteSegment: async (id: string): Promise<void> => {
    await deleteFromDatabase(`segments/${id}`)
  }
}
