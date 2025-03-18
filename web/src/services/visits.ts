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
import moment from 'moment'

export const visitsService = {
  /**
   * Obtém um snapshot de uma referência do Realtime Database.
   */
  getSnapshot: async (reference: any) => {
    return await get(reference)
  },

  /**
   * Recupera a lista de visitas com filtros opcionais.
   */
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

    const visitsArray = Object.entries(visitsData).map(
      ([id, data]: [string, any]) =>
        ({
          id,
          ...data,
          details: {
            ...data.details
          }
        } as Visit)
    )

    return visitsArray
  },

  /**
   * Faz o upload de arquivos para o Storage e retorna suas URLs.
   */
  async uploadDocuments(visitId: string, documents: File[]): Promise<string[]> {
    try {
      const uploadPromises = documents.map(async (file, index) => {
        const fileRef = storageRef(
          storage,
          `visits/${visitId}/${index}_${file.name}`
        )
        const uploadResult = await uploadBytes(fileRef, file)
        return await getDownloadURL(uploadResult.ref)
      })
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Erro ao fazer upload dos documentos:', error)
      throw new Error('Falha ao carregar documentos no Storage')
    }
  },

  /**
   * Remove todos os documentos associados a uma visita no Storage.
   */
  async deleteDocuments(visitId: string): Promise<void> {
    try {
      const folderRef = storageRef(storage, `visits/${visitId}`)
      const listResult = await listAll(folderRef)
      const deletePromises = listResult.items.map(
        async (itemRef: StorageReference) => {
          await deleteObject(itemRef).catch((err) =>
            console.warn(`Erro ao deletar ${itemRef.fullPath}: ${err.message}`)
          )
        }
      )
      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Erro ao deletar documentos do Storage:', error)
      throw new Error('Falha ao remover documentos do Storage')
    }
  },

  /**
   * Cria uma nova visita no Realtime Database e faz upload de documentos, se fornecidos.
   */
  createVisit: async (
    data: VisitRegistrationFormType,
    userId: string
  ): Promise<string> => {
    const visitsRef = dbRef(db, 'visits')
    const newVisitId = `visit_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const newVisitRef = dbRef(db, `visits/${newVisitId}`)

    let documentUrls: string[] | null = null
    if (data.documents && data.documents.length > 0) {
      // Filtra quaisquer elementos undefined e garante que apenas File válidos sejam passados
      const validDocuments = data.documents.filter(
        (file): file is File => file !== undefined
      )
      if (validDocuments.length > 0) {
        documentUrls = await visitsService.uploadDocuments(
          newVisitId,
          validDocuments
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
        documents: documentUrls,
        observations: data.observations || null
      }
    }

    try {
      await set(newVisitRef, newVisit)
      return newVisitId
    } catch (error) {
      console.error('Erro ao criar visita:', error)
      if (documentUrls) {
        await visitsService
          .deleteDocuments(newVisitId)
          .catch((cleanupError) =>
            console.warn('Erro ao limpar documentos após falha:', cleanupError)
          )
      }
      throw new Error('Falha ao criar visita')
    }
  },

  /**
   * Atualiza uma visita existente, gerenciando documentos no Storage conforme necessário.
   */
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
    let documentUrls = existingVisit.details.documents || []

    if (data.documents !== undefined) {
      if (documentUrls.length > 0) {
        await visitsService.deleteDocuments(id)
        documentUrls = []
      }

      if (data.documents && data.documents.length > 0) {
        // Filtra quaisquer elementos undefined e garante que apenas File válidos sejam passados
        const validDocuments = data.documents.filter(
          (file): file is File => file !== undefined
        )
        if (validDocuments.length > 0) {
          documentUrls = await visitsService.uploadDocuments(id, validDocuments)
        }
      }
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
        observations: data.observations ?? existingVisit.details.observations
      }
    }

    try {
      await set(visitRef, updatedVisit)
    } catch (error) {
      console.error('Erro ao atualizar visita:', error)
      if (data.documents && documentUrls.length > 0) {
        await visitsService
          .deleteDocuments(id)
          .catch((cleanupError) =>
            console.warn('Erro ao limpar documentos após falha:', cleanupError)
          )
      }
      throw new Error('Falha ao atualizar visita')
    }
  },

  /**
   * Exclui uma visita e todos os documentos associados no Storage.
   */
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
