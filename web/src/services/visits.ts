// src/services/visits.ts

import { Visit, VisitStatus, VisitRegistrationFormType } from '@/@types/visit'
import { db, storage } from '@/lib/firebase'
import {
  ref as dbRef,
  get,
  set,
  remove,
  query,
  orderByChild,
  startAt,
  endAt
} from 'firebase/database'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference
} from 'firebase/storage'
import { RcFile, UploadFile } from 'antd/lib/upload/interface'
import moment from 'moment'

export const visitsService = {
  getSnapshot: async (reference: any) => {
    return await get(reference)
  },

  getVisits: async (
    filters: Partial<{ voterId: string }>
  ): Promise<Visit[]> => {
    const visitsRef = dbRef(db, 'visits')
    let q = visitsRef

    if (filters.voterId) {
      q = query(
        visitsRef,
        orderByChild('voterId'),
        startAt(filters.voterId),
        endAt(filters.voterId + '\uf8ff')
      ) as any
    }

    const visitsSnapshot = await get(q)
    const visitsData = visitsSnapshot.val() || {}

    return Object.entries(visitsData).map(
      ([id, data]: [string, any]) =>
        ({
          id,
          ...data,
          details: {
            ...data.details
          }
        } as Visit)
    )
  },

  /**
   * Faz o upload de arquivos para o Storage e retorna suas URLs.
   * Aceita RcFile[] do Ant Design.
   */
  async uploadDocuments(
    visitId: string,
    documents: RcFile[]
  ): Promise<string[]> {
    if (!documents || documents.length === 0) {
      return []
    }

    const uploadPromises = documents.map(async (file, index) => {
      if (!(file instanceof File)) {
        throw new Error(`Item ${index} não é um arquivo válido: ${file}`)
      }
      const fileRef = storageRef(
        storage,
        `visits/${visitId}/${index}_${file.name}`
      )
      try {
        const uploadResult = await uploadBytes(fileRef, file)
        const downloadURL = await getDownloadURL(uploadResult.ref)
        return downloadURL
      } catch (error) {
        console.error(`Erro ao fazer upload do arquivo ${file.name}:`, error)
        throw new Error(`Falha ao carregar o arquivo ${file.name}`)
      }
    })

    try {
      const urls = await Promise.all(uploadPromises)
      return urls
    } catch (error) {
      // Em caso de erro, limpa os arquivos já enviados
      await visitsService
        .deleteDocuments(visitId)
        .catch((cleanupError) =>
          console.warn(
            'Erro ao limpar arquivos após falha de upload:',
            cleanupError
          )
        )
      throw new Error('Falha ao carregar documentos no Storage: ' + error)
    }
  },

  /**
   * Remove todos os documentos associados a uma visita no Storage.
   */
  async deleteDocuments(visitId: string): Promise<void> {
    const folderRef = storageRef(storage, `visits/${visitId}`)
    try {
      const listResult = await listAll(folderRef)
      if (listResult.items.length === 0) return

      const deletePromises = listResult.items.map(
        async (itemRef: StorageReference) => {
          try {
            await deleteObject(itemRef)
          } catch (err) {
            console.warn(`Erro ao deletar ${itemRef.fullPath}: ${err}`)
          }
        }
      )
      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Erro ao listar ou deletar documentos do Storage:', error)
      throw new Error('Falha ao remover documentos do Storage')
    }
  },

  createVisit: async (
    data: VisitRegistrationFormType,
    userId: string
  ): Promise<string> => {
    const newVisitId = `visit_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const newVisitRef = dbRef(db, `visits/${newVisitId}`)

    // Processa os documentos: apenas arquivos com originFileObj são considerados
    let documentUrls: string[] = []
    if (data.documents && data.documents.length > 0) {
      const filesToUpload = data.documents
        .map((doc: UploadFile) => doc.originFileObj)
        .filter((file): file is RcFile => file instanceof File)

      if (filesToUpload.length !== data.documents.length) {
        throw new Error(
          'Todos os documentos devem ter originFileObj. Reanexe os arquivos existentes.'
        )
      }

      if (filesToUpload.length > 0) {
        documentUrls = await visitsService.uploadDocuments(
          newVisitId,
          filesToUpload
        )
      }
    }

    const newVisit: Visit = {
      id: newVisitId,
      voterId: data.voterId || '',
      dateTime: moment(data.dateTime, 'DD/MM/YYYY HH:mm').toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userId,
      status: data.status || VisitStatus.AGENDADA,
      details: {
        reason: data.reason || '',
        relatedUserId: data.relatedUserId || '',
        documents: documentUrls.length > 0 ? documentUrls : null,
        observations: data.observations ?? null // Garante que undefined vire null
      }
    }

    try {
      await set(newVisitRef, newVisit)
      return newVisitId
    } catch (error) {
      console.error('Erro ao criar visita no Realtime Database:', error)
      if (documentUrls && documentUrls.length > 0) {
        await visitsService
          .deleteDocuments(newVisitId)
          .catch((cleanupError) =>
            console.warn('Erro ao limpar documentos após falha:', cleanupError)
          )
      }
      throw new Error('Falha ao criar visita: ' + error)
    }
  },

  updateVisit: async (
    id: string,
    data: Partial<VisitRegistrationFormType>
  ): Promise<void> => {
    const visitRef = dbRef(db, `visits/${id}`)
    const snapshot = await get(visitRef)
    if (!snapshot.exists()) {
      throw new Error('Visita não encontrada')
    }

    const existingVisit = snapshot.val() as Visit
    let documentUrls: string[] = []

    if (data.documents !== undefined) {
      // Remove os documentos antigos do Storage
      if (
        existingVisit.details.documents &&
        existingVisit.details.documents.length > 0
      ) {
        await visitsService.deleteDocuments(id)
      }

      // Processa os documentos: apenas arquivos com originFileObj são considerados
      if (data.documents && data.documents.length > 0) {
        const filesToUpload = data.documents
          .map((doc: UploadFile) => doc.originFileObj)
          .filter((file): file is RcFile => file instanceof File)

        if (filesToUpload.length !== data.documents.length) {
          throw new Error(
            'Todos os documentos devem ter originFileObj. Reanexe os arquivos existentes.'
          )
        }

        if (filesToUpload.length > 0) {
          documentUrls = await visitsService.uploadDocuments(id, filesToUpload)
        }
      }
    } else {
      // Se data.documents não foi fornecido, mantém os documentos existentes
      documentUrls = existingVisit.details.documents || []
    }

    const updatedVisit: Visit = {
      ...existingVisit,
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
            : existingVisit.details.observations // Trata undefined explicitamente
      }
    }

    try {
      await set(visitRef, updatedVisit)
    } catch (error) {
      console.error('Erro ao atualizar visita no Realtime Database:', error)
      if (data.documents !== undefined && documentUrls.length > 0) {
        await visitsService
          .deleteDocuments(id)
          .catch((cleanupError) =>
            console.warn('Erro ao limpar documentos após falha:', cleanupError)
          )
      }
      throw new Error('Falha ao atualizar visita: ' + error)
    }
  },

  deleteVisit: async (id: string): Promise<void> => {
    const visitRef = dbRef(db, `visits/${id}`)
    const snapshot = await get(visitRef)
    if (!snapshot.exists()) {
      throw new Error('Visita não encontrada')
    }

    const visit = snapshot.val() as Visit
    if (visit.details.documents && visit.details.documents.length > 0) {
      await visitsService.deleteDocuments(id)
    }

    try {
      await remove(visitRef)
    } catch (error) {
      console.error('Erro ao deletar visita:', error)
      throw new Error('Falha ao excluir visita')
    }
  }
}
