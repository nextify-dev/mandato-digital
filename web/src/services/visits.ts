// src/services/visits.ts

import { Visit, VisitStatus, VisitRegistrationFormType } from '@/@types/visit'
import { RcFile } from 'antd/lib/upload/interface'
import moment from 'moment'
import {
  uploadFilesToStorage,
  deleteFilesFromStorage
} from '@/utils/functions/storageUtils'
import {
  fetchFromDatabase,
  saveToDatabase,
  deleteFromDatabase
} from '@/utils/functions/databaseUtils'
import { deleteObject, listAll, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export const visitsService = {
  getVisits: async (filters?: { voterId: string }): Promise<Visit[]> => {
    return fetchFromDatabase<Visit>(
      'visits',
      filters ? { key: 'voterId', value: filters.voterId } : undefined
    ) as Promise<Visit[]>
  },

  createVisit: async (
    data: VisitRegistrationFormType,
    userId: string,
    userCityId: string
  ): Promise<string> => {
    console.log('DATA CHEGANDO NO SERVICE', data.documents)
    const newVisitId = `visit_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const storagePath = `visits/${newVisitId}`

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

    const newVisit: Visit = {
      id: newVisitId,
      voterId: data.voterId || '',
      cityId: data.cityId || userCityId,
      dateTime: moment(data.dateTime, 'DD/MM/YYYY HH:mm').toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
      status: data.status || VisitStatus.AGENDADA,
      details: {
        reason: data.reason || '',
        relatedUserId: data.relatedUserId || '',
        documents: documentUrls.length > 0 ? documentUrls : null,
        observations: data.observations ?? null
      }
    }

    try {
      await saveToDatabase('visits', newVisit)
      return newVisitId
    } catch (error) {
      if (documentUrls.length > 0) {
        await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
          console.warn('Erro ao limpar arquivos após falha:', cleanupError)
        )
      }
      throw new Error(`Falha ao criar visita: ${error}`)
    }
  },

  updateVisit: async (
    id: string,
    data: Partial<VisitRegistrationFormType>
  ): Promise<void> => {
    console.log('DATA CHEGANDO NO SERVICE', data.documents)
    const existingVisit = (await fetchFromDatabase<Visit>(
      `visits/${id}`,
      undefined,
      true
    )) as Visit

    if (!existingVisit) {
      throw new Error('Visita não encontrada')
    }

    const storagePath = `visits/${id}`
    let documentUrls: string[] = []

    if (data.documents !== undefined) {
      // Identifica os arquivos existentes no banco
      const existingDocuments = existingVisit.details.documents || []

      // Identifica os arquivos que ainda estão no fileList (não foram removidos)
      const filesToKeep = (data.documents || []).filter(
        (doc) => doc.url && existingDocuments.includes(doc.url)
      )
      const urlsToKeep = filesToKeep.map((doc) => doc.url!)

      // Identifica os arquivos que foram removidos
      const urlsToDelete = existingDocuments.filter(
        (url) => !urlsToKeep.includes(url)
      )

      // Identifica os novos arquivos a serem enviados
      const newFilesToUpload = (data.documents || [])
        .filter((doc) => !doc.url) // Arquivos sem URL são novos
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

      // Remove os arquivos que não estão mais no fileList
      if (urlsToDelete.length > 0) {
        try {
          const folderRef = ref(storage, storagePath)
          const listResult = await listAll(folderRef)
          const deletePromises = listResult.items
            .filter((itemRef) => {
              const fileName = itemRef.name
              const fileUrl = `https://firebasestorage.googleapis.com/v0/b/mandatodigital-19990.firebasestorage.app/o/${encodeURIComponent(
                storagePath
              )}%2F${encodeURIComponent(fileName)}?alt=media`
              return urlsToDelete.some((url) => url.includes(fileName))
            })
            .map(async (itemRef) => {
              try {
                await deleteObject(itemRef)
              } catch (err) {
                throw new Error(`Erro ao deletar ${itemRef.fullPath}: ${err}`)
              }
            })
          await Promise.all(deletePromises)
        } catch (error) {
          throw new Error(
            `Falha ao excluir arquivos antigos no Storage: ${error}`
          )
        }
      }

      // Faz o upload dos novos arquivos
      let newDocumentUrls: string[] = []
      if (newFilesToUpload.length > 0) {
        newDocumentUrls = await uploadFilesToStorage(
          storagePath,
          newFilesToUpload
        )
      }

      // Combina as URLs dos arquivos mantidos com as URLs dos novos arquivos
      documentUrls = [...urlsToKeep, ...newDocumentUrls]
    } else {
      documentUrls = existingVisit.details.documents || []
    }

    const updatedVisit: Visit = {
      ...existingVisit,
      cityId: data.cityId ?? existingVisit.cityId,
      status: data.status ?? existingVisit.status,
      details: {
        ...existingVisit.details,
        reason: data.reason ?? existingVisit.details.reason,
        relatedUserId:
          data.relatedUserId ?? existingVisit.details.relatedUserId,
        documents: documentUrls.length > 0 ? documentUrls : null,
        observations:
          data.observations !== undefined
            ? data.observations
            : existingVisit.details.observations
      }
    }

    try {
      await saveToDatabase('visits', updatedVisit)
    } catch (error) {
      if (data.documents !== undefined && documentUrls.length > 0) {
        await deleteFilesFromStorage(storagePath).catch((cleanupError) =>
          console.warn('Erro ao limpar arquivos após falha:', cleanupError)
        )
      }
      throw new Error(`Falha ao atualizar visita: ${error}`)
    }
  },

  deleteVisit: async (id: string): Promise<void> => {
    const existingVisit = (await fetchFromDatabase<Visit>(
      `visits/${id}`,
      undefined,
      true
    )) as Visit

    if (!existingVisit) {
      throw new Error('Visita não encontrada')
    }

    if (
      existingVisit.details.documents &&
      existingVisit.details.documents.length > 0
    ) {
      try {
        await deleteFilesFromStorage(`visits/${id}`)
      } catch (error) {
        throw new Error(`Falha ao excluir arquivos no Storage: ${error}`)
      }
    }

    await deleteFromDatabase(`visits/${id}`)
  }
}
