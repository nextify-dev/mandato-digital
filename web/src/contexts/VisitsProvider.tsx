// src/contexts/VisitsProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { Visit, VisitRegistrationFormType, VisitStatus } from '@/@types/visit'
import { UploadFile } from 'antd/lib/upload/interface'
import { visitsService } from '@/services/visits'
import { useAuth } from '@/contexts/AuthProvider'
import { db } from '@/lib/firebase'
import { ref, onValue, get } from 'firebase/database'
import { User } from '@/@types/user'
import moment from 'moment'

interface VisitsContextData {
  visits: Visit[]
  loading: boolean
  filters: Partial<VisitFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<VisitFilters>>>
  createVisit: (data: VisitRegistrationFormType) => Promise<string>
  updateVisit: (
    id: string,
    data: Partial<VisitRegistrationFormType>
  ) => Promise<void>
  deleteVisit: (id: string) => Promise<void>
  getInitialData: (visit: Visit) => Promise<Partial<VisitRegistrationFormType>>
}

interface VisitFilters {
  voterId: string
  status?: VisitStatus
  relatedUserId?: string
}

const VisitsContext = createContext<VisitsContextData>({} as VisitsContextData)

export const VisitsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<VisitFilters>>({})

  useEffect(() => {
    const visitsRef = ref(db, 'visits')
    setLoading(true)

    const unsubscribeVisits = onValue(
      visitsRef,
      async (snapshot) => {
        const visitsData = snapshot.val() || {}
        const visitsArray = await processVisitsData(visitsData, filters)
        setVisits(visitsArray)
        setLoading(false)
      },
      (error) => {
        messageApi.error(
          'Erro ao carregar visitas, tente reiniciar a página ou contacte um administrador'
        )
        setLoading(false)
      }
    )

    return () => unsubscribeVisits()
  }, [filters, messageApi])

  const processVisitsData = async (
    visitsData: { [key: string]: any },
    filters: Partial<VisitFilters>
  ): Promise<Visit[]> => {
    let visitsArray = Object.entries(visitsData).map(
      ([id, data]: [string, any]) =>
        ({
          id,
          ...data,
          details: { ...data.details }
        } as Visit)
    )

    if (filters.voterId) {
      visitsArray = visitsArray.filter(
        (visit) => visit.voterId === filters.voterId
      )
    }
    if (filters.status) {
      visitsArray = visitsArray.filter(
        (visit) => visit.status === filters.status
      )
    }
    if (filters.relatedUserId) {
      visitsArray = visitsArray.filter(
        (visit) => visit.details.relatedUserId === filters.relatedUserId
      )
    }

    return visitsArray
  }

  const createVisit = async (
    data: VisitRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newVisitId = await visitsService.createVisit(data, user.id)
      messageApi.success('Visita criada com sucesso!')
      setLoading(false)
      return newVisitId
    } catch (error: any) {
      messageApi.error('Erro ao criar visita, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updateVisit = async (
    id: string,
    data: Partial<VisitRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      await visitsService.updateVisit(id, data)
      messageApi.success('Visita atualizada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar visita, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deleteVisit = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await visitsService.deleteVisit(id)
      messageApi.success('Visita deletada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar visita, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const getInitialData = async (
    visit: Visit
  ): Promise<Partial<VisitRegistrationFormType>> => {
    const extractFileInfo = (url: string, index: number) => {
      const cleanUrl = url.split('?')[0]
      const segments = cleanUrl.split('/')
      let lastSegment = segments.pop() || ''
      const pathSegments = lastSegment.split('%2F')
      let fileNameEncoded = pathSegments.pop() || `Documento ${index + 1}`
      const fileName = decodeURIComponent(fileNameEncoded)
      const extensionMatch = fileName.match(/\.([^.]+)$/)
      const extension = extensionMatch
        ? extensionMatch[1].toLowerCase()
        : 'desconhecido'
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov']
      const documentExtensions = ['pdf', 'doc', 'docx', 'txt']
      const spreadsheetExtensions = ['xls', 'xlsx', 'csv']
      let type: string
      if (imageExtensions.includes(extension)) {
        type = 'image'
      } else if (videoExtensions.includes(extension)) {
        type = 'video'
      } else if (documentExtensions.includes(extension)) {
        type = 'document'
      } else if (spreadsheetExtensions.includes(extension)) {
        type = 'spreadsheet'
      } else {
        type = 'other'
      }

      return {
        uid: `${index}`,
        name: fileName,
        status: 'done' as const,
        url,
        type,
        extension
      }
    }

    const documents = visit.details.documents
      ? visit.details.documents.map((url, index) => extractFileInfo(url, index))
      : null

    return {
      voterId: visit.voterId,
      dateTime: visit.dateTime
        ? moment(visit.dateTime).format('DD/MM/YYYY HH:mm')
        : '',
      status: visit.status,
      reason: visit.details.reason,
      relatedUserId: visit.details.relatedUserId,
      documents,
      observations: visit.details.observations || null
    }
  }

  return (
    <VisitsContext.Provider
      value={{
        visits,
        loading,
        filters,
        setFilters,
        createVisit,
        updateVisit,
        deleteVisit,
        getInitialData
      }}
    >
      {contextHolder}
      {children}
    </VisitsContext.Provider>
  )
}

export const useVisits = () => useContext(VisitsContext)
