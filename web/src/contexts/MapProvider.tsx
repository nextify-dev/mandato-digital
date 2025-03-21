// src/contexts/MapProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { MapPoint, MapFilters, SideCardData } from '@/@types/map'
import { User, UserRole } from '@/@types/user'
import { useUsers } from '@/contexts/UsersProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { useDemands } from '@/contexts/DemandsProvider'
import { useVisits } from '@/contexts/VisitsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import moment from 'moment'

interface MapContextData {
  mapPoints: MapPoint[]
  filters: MapFilters
  setFilters: React.Dispatch<React.SetStateAction<MapFilters>>
  loading: boolean
  getMapPoints: () => Promise<void>
  calculateElectoralBase: (vereadorId: string) => number
  calculateLinkedVoters: (caboEleitoralId: string) => number
  getSideCardData: (point: MapPoint) => SideCardData
}

const MapContext = createContext<MapContextData>({} as MapContextData)

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const { users, voters, allUsers } = useUsers()
  const { cities } = useCities()
  const { demands } = useDemands()
  const { visits } = useVisits()
  const [messageApi, contextHolder] = message.useMessage()
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [filters, setFilters] = useState<MapFilters>({})
  const [loading, setLoading] = useState(false)

  const fetchMapPoints = async () => {
    if (!user) return

    setLoading(true)
    try {
      const allowedCityIds =
        user.role === UserRole.ADMINISTRADOR_GERAL
          ? cities.map((city) => city.id)
          : [user.cityId]

      // Filtrar usuários com base nos filtros e permissões
      const filteredUsers = allUsers.filter((u) => {
        return (
          allowedCityIds.includes(u.cityId) &&
          (!filters.cityId || u.cityId === filters.cityId) &&
          (!filters.userType || filters.userType.includes(u.role)) &&
          (!filters.bairro || u.profile?.bairro === filters.bairro) &&
          (!filters.vereadorId || u.vereadorId === filters.vereadorId) &&
          (!filters.demandStatus || u.demandsStatus === filters.demandStatus)
        )
      })

      // Mapear usuários para pontos do mapa
      const pointsPromises = filteredUsers.map(async (u) => {
        const recentDemands = demands.filter(
          (demand) =>
            demand.voterId === u.id &&
            moment(demand.createdAt).isAfter(moment().subtract(30, 'days'))
        ).length

        const recentVisitsList = visits
          .filter(
            (visit) =>
              visit.voterId === u.id &&
              moment(visit.createdAt).isAfter(moment().subtract(30, 'days'))
          )
          .map((visit) => ({
            id: visit.id,
            dateTime: visit.dateTime,
            reason: visit.details.reason,
            status: visit.status
          }))

        return {
          id: u.id,
          latitude:
            parseFloat(u.profile?.cep.replace(/\D/g, '').slice(0, 2)) || 0, // Simulação de latitude
          longitude:
            parseFloat(u.profile?.cep.replace(/\D/g, '').slice(2, 4)) || 0, // Simulação de longitude
          type: u.role,
          user: u,
          recentDemands,
          recentVisits: recentVisitsList,
          demandsStatus: demands.find((demand) => demand.voterId === u.id)
            ?.status
        } as MapPoint
      })

      const points = await Promise.all(pointsPromises)
      setMapPoints(points)
    } catch (error: any) {
      messageApi.error('Erro ao carregar pontos do mapa: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMapPoints()
  }, [filters, user, allUsers, demands, visits, cities])

  const calculateElectoralBase = (vereadorId: string): number => {
    return mapPoints.filter(
      (point) =>
        point.type === UserRole.ELEITOR && point.user.vereadorId === vereadorId
    ).length
  }

  const calculateLinkedVoters = (caboEleitoralId: string): number => {
    return mapPoints.filter(
      (point) =>
        point.type === UserRole.ELEITOR &&
        point.user.caboEleitoralId === caboEleitoralId
    ).length
  }

  const getSideCardData = (point: MapPoint): SideCardData => {
    return {
      user: point.user,
      recentDemands: point.recentDemands || 0,
      recentVisits: point.recentVisits || [],
      electoralBase:
        point.type === UserRole.VEREADOR
          ? calculateElectoralBase(point.user.id)
          : undefined,
      linkedVoters:
        point.type === UserRole.CABO_ELEITORAL
          ? calculateLinkedVoters(point.user.id)
          : undefined
    }
  }

  return (
    <MapContext.Provider
      value={{
        mapPoints,
        filters,
        setFilters,
        loading,
        getMapPoints: fetchMapPoints,
        calculateElectoralBase,
        calculateLinkedVoters,
        getSideCardData
      }}
    >
      {contextHolder}
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) throw new Error('useMap must be used within a MapProvider')
  return context
}
