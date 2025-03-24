import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react'
import { User, UserRole, UserStatus } from '@/@types/user'
import { City, CityStatus } from '@/@types/city'
import { Visit, VisitStatus } from '@/@types/visit'
import { Demand, DemandStatus } from '@/@types/demand'
import { Ticket, TicketStatus } from '@/@types/tickets'
import { Segment } from '@/@types/segment'
import { Poll } from '@/@types/poll'
import { useUsers } from '@/contexts/UsersProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { useVisits } from '@/contexts/VisitsProvider'
import { useDemands } from '@/contexts/DemandsProvider'
import { useTickets } from '@/contexts/TicketsProvider'
import { useSegments } from '@/contexts/SegmentsProvider'
import { usePolls } from '@/contexts/PollsProvider'

// Interface for the aggregated dashboard data
interface DashboardData {
  totalUsers: number
  totalCities: number
  totalActiveDemands: number
  totalScheduledVisits: number
  totalOpenTickets: number
  totalActiveSegments: number
  totalActivePolls: number
  userRoleDistribution: { [key in UserRole]?: number }
  cityStatusDistribution: { [key in CityStatus]?: number }
  demandStatusDistribution: { [key in DemandStatus]?: number }
  recentActivity: {
    recentDemands: Demand[]
    recentVisits: Visit[]
    recentTickets: Ticket[]
  }
}

// Dashboard Context
interface DashboardContextType {
  dashboardData: DashboardData | null
  loading: boolean
  error: string | null
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

// Dashboard Provider Component
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { users, loading: usersLoading } = useUsers()
  const { cities, loading: citiesLoading } = useCities()
  const { visits, loading: visitsLoading } = useVisits()
  const { demands, loading: demandsLoading } = useDemands()
  const { tickets, loading: ticketsLoading } = useTickets()
  const { segments, loading: segmentsLoading } = useSegments()
  const { polls, loading: pollsLoading } = usePolls()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Function to check if all contexts are done loading
  const isLoading = useCallback(() => {
    return (
      usersLoading ||
      citiesLoading ||
      visitsLoading ||
      demandsLoading ||
      ticketsLoading ||
      segmentsLoading ||
      pollsLoading
    )
  }, [
    usersLoading,
    citiesLoading,
    visitsLoading,
    demandsLoading,
    ticketsLoading,
    segmentsLoading,
    pollsLoading
  ])

  // Function to compute dashboard data
  const computeDashboardData = useCallback(() => {
    try {
      // Initialize default values for empty data
      const safeUsers: User[] = Array.isArray(users) ? users : []
      const safeCities: City[] = Array.isArray(cities) ? cities : []
      const safeVisits: Visit[] = Array.isArray(visits) ? visits : []
      const safeDemands: Demand[] = Array.isArray(demands) ? demands : []
      const safeTickets: Ticket[] = Array.isArray(tickets) ? tickets : []
      const safeSegments: Segment[] = Array.isArray(segments) ? segments : []
      const safePolls: Poll[] = Array.isArray(polls) ? polls : []

      // Filter out Eleitor users
      const nonVoterUsers = safeUsers.filter(
        (user: User) => user.role !== UserRole.ELEITOR
      )

      // Total non-voter users
      const totalUsers = nonVoterUsers.length

      // Total active cities
      const totalCities = safeCities.filter(
        (city: City) => city.status === CityStatus.ATIVA
      ).length

      // Total active demands (nova or em_analise)
      const totalActiveDemands = safeDemands.filter((demand: Demand) =>
        [DemandStatus.NOVA, DemandStatus.EM_ANALISE].includes(demand.status)
      ).length

      // Total scheduled visits
      const totalScheduledVisits = safeVisits.filter(
        (visit: Visit) => visit.status === VisitStatus.AGENDADA
      ).length

      // Total open tickets (aberto or em_andamento)
      const totalOpenTickets = safeTickets.filter((ticket: Ticket) =>
        [TicketStatus.ABERTO, TicketStatus.EM_ANDAMENTO].includes(ticket.status)
      ).length

      // Total active segments
      const totalActiveSegments = safeSegments.filter(
        (segment: Segment) => segment.isActive
      ).length

      // Total active polls
      const totalActivePolls = safePolls.filter(
        (poll: Poll) => poll.isActive
      ).length

      // User role distribution (excluding Eleitor)
      const userRoleDistribution = nonVoterUsers.reduce(
        (acc: { [key in UserRole]?: number }, user: User) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        },
        {}
      )

      // City status distribution
      const cityStatusDistribution = safeCities.reduce(
        (acc: { [key in CityStatus]?: number }, city: City) => {
          acc[city.status] = (acc[city.status] || 0) + 1
          return acc
        },
        {}
      )

      // Demand status distribution
      const demandStatusDistribution = safeDemands.reduce(
        (acc: { [key in DemandStatus]?: number }, demand: Demand) => {
          acc[demand.status] = (acc[demand.status] || 0) + 1
          return acc
        },
        {}
      )

      // Recent activity (last 5 items for each, or fewer if data is limited)
      const recentDemands = [...safeDemands]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
      const recentVisits = [...safeVisits]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
      const recentTickets = [...safeTickets]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)

      const data: DashboardData = {
        totalUsers,
        totalCities,
        totalActiveDemands,
        totalScheduledVisits,
        totalOpenTickets,
        totalActiveSegments,
        totalActivePolls,
        userRoleDistribution,
        cityStatusDistribution,
        demandStatusDistribution,
        recentActivity: {
          recentDemands,
          recentVisits,
          recentTickets
        }
      }

      return data
    } catch (err) {
      throw new Error(
        `Erro ao processar os dados do dashboard: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }, [users, cities, visits, demands, tickets, segments, polls])

  // Effect to handle data fetching and computation
  useEffect(() => {
    const fetchAndComputeData = async () => {
      setLoading(true)
      setError(null)

      try {
        if (isLoading()) {
          return
        }

        const data = await computeDashboardData()
        setDashboardData(data)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro desconhecido ao carregar os dados do dashboard'
        )
        setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAndComputeData()
  }, [isLoading, computeDashboardData])

  return (
    <DashboardContext.Provider value={{ dashboardData, loading, error }}>
      {children}
    </DashboardContext.Provider>
  )
}
