// src/services/demand.ts

import {
  Demand,
  DemandStatus,
  DemandRegistrationFormType
} from '@/@types/demand'
import { RcFile } from 'antd/lib/upload/interface'
import moment from 'moment'
import {
  fetchFromDatabase,
  saveToDatabase,
  deleteFromDatabase
} from '@/utils/functions/databaseUtils'
import {
  uploadFilesToStorage,
  deleteFilesFromStorage,
  deleteSpecificFilesFromStorage
} from '@/utils/functions/storageUtils'

export const demandsService = {
  getDemands: async (filters?: { voterId: string }): Promise<Demand[]> => {
    return fetchFromDatabase<Demand>(
      'demands',
      filters ? { key: 'voterId', value: filters.voterId } : undefined
    ) as Promise<Demand[]>
  },

  createDemand: async (
    data: DemandRegistrationFormType,
    userId: string,
    userCityId: string,
    userRole: string
  ): Promise<string> => {
    const newDemandId = `demand_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const protocol = `DM-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`
    const storagePath = `demands/${newDemandId}`

    let documentUrls: string[] = []
    if (data.documents && data.documents.length > 0) {
      const filesToUpload = data.documents
        .map((doc) => doc.originFileObj)
        .filter((file): file is RcFile => file instanceof File)

      if (filesToUpload.length !== data.documents.length) {
        throw new Error(
          'Todos os documentos devem ter originFileObj. Reanexe os arquivos existentes.'
        )
      }

      if (filesToUpload.length > 0) {
        // Não há arquivos antigos para limpar em uma criação, mas garantimos que o caminho esteja limpo
        try {
          await deleteFilesFromStorage(storagePath)
        } catch (error) {
          throw new Error(
            `Falha ao limpar arquivos antigos no Storage: ${error}`
          )
        }

        documentUrls = await uploadFilesToStorage(storagePath, filesToUpload)
      }
    }

    const newDemand: Demand = {
      id: newDemandId,
      protocol,
      voterId: data.voterId || '',
      cityId: data.cityId || userCityId,
      description: data.description || '',
      status: data.status || DemandStatus.NOVA,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      relatedUserId: data.relatedUserId || '',
      details: {
        documents: documentUrls.length > 0 ? documentUrls : null,
        updates: null
      }
    }

    try {
      await saveToDatabase('demands', newDemand)
      return newDemandId
    } catch (error) {
      if (documentUrls.length > 0) {
        await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
          console.warn('Erro ao limpar arquivos após falha:', cleanupError)
        )
      }
      throw new Error(`Falha ao criar demanda: ${error}`)
    }
  },

  updateDemand: async (
    id: string,
    data: Partial<DemandRegistrationFormType>,
    updatedBy: string
  ): Promise<void> => {
    const existingDemand = (await fetchFromDatabase<Demand>(
      `demands/${id}`,
      undefined,
      true
    )) as Demand

    if (!existingDemand) {
      throw new Error('Demanda não encontrada')
    }

    const storagePath = `demands/${id}`
    let documentUrls: string[] = []

    if (data.documents !== undefined) {
      const existingDocuments = existingDemand.details?.documents || []
      const filesToKeep = (data.documents || []).filter(
        (doc) => doc.url && existingDocuments.includes(doc.url)
      )
      const urlsToKeep = filesToKeep.map((doc) => doc.url!)
      const urlsToDelete = existingDocuments.filter(
        (url) => !urlsToKeep.includes(url)
      )
      const newFilesToUpload = (data.documents || [])
        .filter((doc) => !doc.url)
        .map((doc) => doc.originFileObj)
        .filter((file): file is RcFile => file instanceof File)

      if (
        newFilesToUpload.length > 0 &&
        newFilesToUpload.length !==
          (data.documents || []).filter((doc) => !doc.url).length
      ) {
        throw new Error(
          'Todos os novos documentos devem ter originFileObj. Reanexe os arquivos existentes.'
        )
      }

      // Deletar arquivos que não estão mais na lista
      if (urlsToDelete.length > 0) {
        try {
          await deleteSpecificFilesFromStorage(storagePath, urlsToDelete)
        } catch (error) {
          throw new Error(
            `Falha ao excluir arquivos antigos no Storage: ${error}`
          )
        }
      }

      // Fazer upload dos novos arquivos
      let newDocumentUrls: string[] = []
      if (newFilesToUpload.length > 0) {
        newDocumentUrls = await uploadFilesToStorage(
          storagePath,
          newFilesToUpload
        )
      }

      // Combinar URLs mantidas com as novas
      documentUrls = [...urlsToKeep, ...newDocumentUrls]
    } else {
      // Se documents não foi alterado, mantém os documentos existentes
      documentUrls = existingDemand.details?.documents || []
    }

    const newUpdate =
      data.status && data.status !== existingDemand.status
        ? {
            updatedAt: new Date().toISOString(),
            updatedBy,
            newStatus: data.status
          }
        : null

    const updatedDemand: Demand = {
      ...existingDemand,
      cityId: data.cityId ?? existingDemand.cityId,
      description: data.description ?? existingDemand.description,
      status: data.status ?? existingDemand.status,
      relatedUserId: data.relatedUserId ?? existingDemand.relatedUserId,
      details: {
        ...existingDemand.details,
        documents: documentUrls.length > 0 ? documentUrls : null,
        updates: newUpdate
          ? [...(existingDemand.details?.updates || []), newUpdate]
          : existingDemand.details?.updates
      }
    }

    try {
      await saveToDatabase('demands', updatedDemand)
    } catch (error) {
      if (data.documents !== undefined && documentUrls.length > 0) {
        await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
          console.warn('Erro ao limpar arquivos após falha:', cleanupError)
        )
      }
      throw new Error(`Falha ao atualizar demanda: ${error}`)
    }
  },

  deleteDemand: async (id: string): Promise<void> => {
    const existingDemand = (await fetchFromDatabase<Demand>(
      `demands/${id}`,
      undefined,
      true
    )) as Demand

    if (!existingDemand) {
      throw new Error('Demanda não encontrada')
    }

    if (
      existingDemand.details?.documents &&
      existingDemand.details.documents.length > 0
    ) {
      try {
        await deleteFilesFromStorage(`demands/${id}`)
      } catch (error) {
        throw new Error(`Falha ao excluir arquivos no Storage: ${error}`)
      }
    }

    await deleteFromDatabase(`demands/${id}`)
  }
}
