// src/screens/DashboardV1/views/MapaEleitoralView/hooks/useMapData.ts

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { useDemands } from '@/contexts/DemandsProvider'
import { useVisits } from '@/contexts/VisitsProvider'
import { MapPoint, MapFilters, Coordinates } from '@/@types/map'
import { UserRole } from '@/@types/user'
import axios from 'axios'

// Função para obter coordenadas a partir de um endereço usando a API de Geocoding do Google Maps
const getCoordinatesFromAddress = async (
  address: string
): Promise<Coordinates> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API
  if (!apiKey) {
    throw new Error('Chave da API do Google Maps não configurada.')
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: apiKey
        }
      }
    )

    const { results, status } = response.data
    if (status !== 'OK' || results.length === 0) {
      throw new Error(
        'Não foi possível obter as coordenadas para o endereço fornecido.'
      )
    }

    const { lat, lng } = results[0].geometry.location
    return { lat, lng }
  } catch (error) {
    console.error('Erro ao obter coordenadas:', error)
    // Fallback: coordenadas padrão (ex.: São Paulo) em caso de erro
    return { lat: -23.5505, lng: -46.6333 }
  }
}

export const useMapData = () => {
  const { user } = useAuth()
  const { allUsers } = useUsers()
  const { cities } = useCities()
  const { demands } = useDemands()
  const { visits } = useVisits()
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [filters, setFilters] = useState<MapFilters>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMapData = async () => {
      if (!user) return

      setLoading(true)
      try {
        const allowedCityIds =
          user.role === UserRole.ADMINISTRADOR_GERAL
            ? cities.map((city) => city.id)
            : [user.cityId]

        let filteredUsers = allUsers.filter((u) => {
          if (!allowedCityIds.includes(u.cityId)) return false
          if (user.role === UserRole.VEREADOR) {
            return u.vereadorId === user.id || u.id === user.id
          }
          if (user.role === UserRole.CABO_ELEITORAL) {
            return u.caboEleitoralId === user.id || u.id === user.id
          }
          if (user.role === UserRole.ELEITOR) {
            return u.id === user.id
          }
          return true
        })

        if (filters.cityId) {
          filteredUsers = filteredUsers.filter(
            (u) => u.cityId === filters.cityId
          )
        }
        if (filters.userType && filters.userType.length > 0) {
          filteredUsers = filteredUsers.filter((u) =>
            filters.userType!.includes(u.role)
          )
        }
        if (filters.bairro) {
          filteredUsers = filteredUsers.filter(
            (u) =>
              u.profile?.bairro.toLowerCase() === filters.bairro?.toLowerCase()
          )
        }
        if (filters.vereadorId) {
          filteredUsers = filteredUsers.filter(
            (u) =>
              u.vereadorId === filters.vereadorId || u.id === filters.vereadorId
          )
        }

        const pointsPromises = filteredUsers.map(async (u) => {
          if (!u.profile?.endereco) return null

          const address = `${u.profile.endereco}, ${u.profile.numero}, ${u.profile.bairro}, ${u.profile.cidade}, ${u.profile.estado}`
          const coords = await getCoordinatesFromAddress(address)

          const userDemands = demands.filter((d) => d.voterId === u.id)
          const lastDemand = userDemands.sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          )[0]

          return {
            id: u.id,
            user: u,
            latitude: coords.lat,
            longitude: coords.lng,
            type: u.role,
            demandsStatus: lastDemand ? lastDemand.status : undefined
          } as MapPoint
        })

        const points = (await Promise.all(pointsPromises)).filter(
          (point): point is MapPoint => point !== null
        )

        if (filters.demandStatus) {
          setMapPoints(
            points.filter((p) => p.demandsStatus === filters.demandStatus)
          )
        } else {
          setMapPoints(points)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do mapa:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMapData()
  }, [user, allUsers, cities, demands, filters])

  return { mapPoints, filters, setFilters, loading }
}
