// src/services/visits.ts
import { ref, set, get, remove, update } from 'firebase/database'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage'
import { db, storage, auth } from '@/lib/firebase'
import { Visit, VisitRegistrationFormType } from '@/@types/visit'
import { convertToISODate } from '@/utils/functions/masks'
import { User } from '@/@types/user'

export const visitsService = {
  async registerVisit(data: VisitRegistrationFormType): Promise<string> {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Usuário não autenticado')

    const visitId = `visit_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const visitRef = ref(db, `visits/${visitId}`)

    // Upload de documentos, se houver
    let documentUrls: string[] | null = null
    if (
      data.documents &&
      Array.isArray(data.documents) &&
      data.documents.length > 0
    ) {
      const uploadPromises = data.documents.map(async (file, index) => {
        if (!(file instanceof File)) {
          throw new Error(`Item ${index} não é um arquivo válido`)
        }
        const fileRef = storageRef(
          storage,
          `visits/${visitId}/doc_${index}_${file.name}`
        )
        const uploadResult = await uploadBytes(fileRef, file)
        return getDownloadURL(uploadResult.ref)
      })
      documentUrls = await Promise.all(uploadPromises)
    }

    // Conversão da data para formato ISO
    const [date, time] = data.dateTime.split(' ')
    const isoDateTime = `${convertToISODate(date)}T${time}:00Z`

    // Criação do objeto Visit
    const newVisit: Visit = {
      id: visitId,
      voterId: data.voterId,
      dateTime: isoDateTime,
      reason: data.reason,
      relatedUserId: data.relatedUserId,
      relatedUserRole: await this.getUserRole(data.relatedUserId),
      documents: documentUrls || null,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      updatedAt: null,
      updatedBy: null
    }

    try {
      await set(visitRef, newVisit)
      return visitId
    } catch (error) {
      console.error('Erro ao registrar visita:', error)
      throw new Error('Falha ao registrar visita no banco de dados')
    }
  },

  async updateVisit(
    visitId: string,
    data: VisitRegistrationFormType
  ): Promise<void> {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Usuário não autenticado')

    const visitRef = ref(db, `visits/${visitId}`)

    // Verifica se a visita existe
    const snapshot = await get(visitRef)
    if (!snapshot.exists()) throw new Error('Visita não encontrada')

    const existingVisit = snapshot.val() as Visit
    const existingDocuments = existingVisit.documents || []

    // Upload de novos documentos e remoção dos antigos, se necessário
    let documentUrls: string[] | null = existingDocuments
    if (data.documents && Array.isArray(data.documents)) {
      // Remove todos os documentos antigos do Storage
      const folderRef = storageRef(storage, `visits/${visitId}`)
      const listResult = await listAll(folderRef)
      await Promise.all(listResult.items.map((item) => deleteObject(item)))

      // Faz upload dos novos documentos
      if (data.documents.length > 0) {
        const uploadPromises = data.documents.map(async (file, index) => {
          if (!(file instanceof File)) {
            throw new Error(`Item ${index} não é um arquivo válido`)
          }
          const fileRef = storageRef(
            storage,
            `visits/${visitId}/doc_${index}_${file.name}`
          )
          const uploadResult = await uploadBytes(fileRef, file)
          return getDownloadURL(uploadResult.ref)
        })
        documentUrls = await Promise.all(uploadPromises)
      } else {
        documentUrls = null
      }
    }

    // Conversão da data para formato ISO
    const [date, time] = data.dateTime.split(' ')
    const isoDateTime = `${convertToISODate(date)}T${time}:00Z`

    // Atualização do objeto Visit
    const updatedVisit: Partial<Visit> = {
      voterId: data.voterId,
      dateTime: isoDateTime,
      reason: data.reason,
      relatedUserId: data.relatedUserId,
      relatedUserRole: await this.getUserRole(data.relatedUserId),
      documents: documentUrls,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.uid
    }

    try {
      await update(visitRef, updatedVisit)
    } catch (error) {
      console.error('Erro ao atualizar visita:', error)
      throw new Error('Falha ao atualizar visita no banco de dados')
    }
  },

  async deleteVisit(visitId: string): Promise<void> {
    const visitRef = ref(db, `visits/${visitId}`)

    // Verifica se a visita existe
    const snapshot = await get(visitRef)
    if (!snapshot.exists()) throw new Error('Visita não encontrada')

    // Remove documentos do Storage, se existirem
    const folderRef = storageRef(storage, `visits/${visitId}`)
    const listResult = await listAll(folderRef)
    await Promise.all(listResult.items.map((item) => deleteObject(item)))

    // Remove a visita do Realtime Database
    try {
      await remove(visitRef)
    } catch (error) {
      console.error('Erro ao excluir visita:', error)
      throw new Error('Falha ao excluir visita do banco de dados')
    }
  },

  async getVisitsByCity(cityId: string): Promise<Visit[]> {
    try {
      const visitsRef = ref(db, 'visits')
      const snapshot = await get(visitsRef)
      const visitsData = snapshot.val() || {}

      const visitsArray = Object.entries(visitsData).map(([id, visit]) => ({
        id,
        ...(visit as Omit<Visit, 'id'>)
      })) as Visit[]

      // Filtra visitas verificando a cidade do eleitor associado
      const filteredVisits = await Promise.all(
        visitsArray.map(async (visit) => {
          const voter = await this.getUserData(visit.voterId)
          return voter?.cityId === cityId ? visit : null
        })
      )

      return filteredVisits
        .filter((visit): visit is Visit => visit !== null)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) // Ordena por data de criação (mais recente primeiro)
    } catch (error) {
      console.error('Erro ao buscar visitas por cidade:', error)
      throw new Error('Falha ao buscar visitas')
    }
  },

  async getUserData(userId: string): Promise<User | null> {
    try {
      const userRef = ref(db, `users/${userId}`)
      const snapshot = await get(userRef)
      return snapshot.exists() ? (snapshot.val() as User) : null
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      return null
    }
  },

  async getUserRole(userId: string): Promise<User['role']> {
    const user = await this.getUserData(userId)
    if (!user) throw new Error('Usuário vinculado não encontrado')
    return user.role
  }
}
