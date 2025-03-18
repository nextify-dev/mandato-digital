// src/contexts/VisitsProvider.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { visitsService } from '@/services/visits'
import { Visit, VisitRegistrationFormType } from '@/@types/visit'
import { useAuth } from './AuthProvider'

interface VisitsContextType {
  visits: Visit[]
  loading: boolean
  registerVisit: (data: VisitRegistrationFormType) => Promise<void>
  updateVisit: (
    visitId: string,
    data: VisitRegistrationFormType
  ) => Promise<void>
  deleteVisit: (visitId: string) => Promise<void>
  fetchVisits: () => Promise<void> // Exposto para permitir atualização manual
}

const VisitsContext = createContext<VisitsContextType | undefined>(undefined)

export const VisitsProvider = ({ children }: { children: ReactNode }) => {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.cityId) {
      fetchVisits()
    }
  }, [user])

  const fetchVisits = async () => {
    setLoading(true)
    try {
      const cityVisits = await visitsService.getVisitsByCity(user!.cityId)
      setVisits(cityVisits)
    } catch (error) {
      console.error('Erro ao carregar visitas:', error)
    } finally {
      setLoading(false)
    }
  }

  const registerVisit = async (data: VisitRegistrationFormType) => {
    try {
      await visitsService.registerVisit(data)
      await fetchVisits() // Atualiza a lista após registro
    } catch (error) {
      console.error('Erro ao registrar visita:', error)
      throw error
    }
  }

  const updateVisit = async (
    visitId: string,
    data: VisitRegistrationFormType
  ) => {
    try {
      await visitsService.updateVisit(visitId, data)
      await fetchVisits() // Atualiza a lista após edição
    } catch (error) {
      console.error('Erro ao atualizar visita:', error)
      throw error
    }
  }

  const deleteVisit = async (visitId: string) => {
    try {
      await visitsService.deleteVisit(visitId)
      await fetchVisits() // Atualiza a lista após exclusão
    } catch (error) {
      console.error('Erro ao excluir visita:', error)
      throw error
    }
  }

  return (
    <VisitsContext.Provider
      value={{
        visits,
        loading,
        registerVisit,
        updateVisit,
        deleteVisit,
        fetchVisits
      }}
    >
      {children}
    </VisitsContext.Provider>
  )
}

export const useVisits = () => {
  const context = useContext(VisitsContext)
  if (!context) {
    throw new Error('useVisits must be used within a VisitsProvider')
  }
  return context
}
