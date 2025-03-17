// src/contexts/CitiesProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { City, CityRegistrationFormType } from '@/@types/city'
import { citiesService } from '@/services/cities'
import { useAuth } from '@/contexts/AuthProvider'
import { db } from '@/lib/firebase'
import { ref, onValue, off } from 'firebase/database'
import { UserRole } from '@/@types/user'

interface CitiesContextData {
  cities: City[]
  loading: boolean
  filters: Partial<CityFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<CityFilters>>>
  createCity: (data: CityRegistrationFormType) => Promise<string>
  updateCity: (
    id: string,
    data: Partial<CityRegistrationFormType>
  ) => Promise<void>
  deleteCity: (id: string) => Promise<void>
  getInitialData: (city: City) => Partial<CityRegistrationFormType>
}

interface CityFilters {
  name: string
}

const CitiesContext = createContext<CitiesContextData>({} as CitiesContextData)

export const CitiesProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<CityFilters>>({})

  useEffect(() => {
    const citiesRef = ref(db, 'cities')
    setLoading(true)

    const unsubscribe = onValue(
      citiesRef,
      async (snapshot) => {
        const citiesData = snapshot.val() || {}
        const citiesArray = await processCitiesData(citiesData, filters)
        setCities(citiesArray)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao ouvir mudanças em /cities:', error)
        setLoading(false)
      }
    )

    return () => off(citiesRef, 'value', unsubscribe)
  }, [filters])

  const processCitiesData = async (
    citiesData: { [key: string]: any },
    filters: Partial<CityFilters>
  ): Promise<City[]> => {
    const usersRef = ref(db, 'users')
    const usersSnapshot = await citiesService.getSnapshot(usersRef)
    const usersData = usersSnapshot.val() || {}

    let citiesArray = Object.entries(citiesData).map(
      ([id, data]: [string, any]) => {
        const cityUsers = Object.values(usersData).filter(
          (user: any) => user.cityId === id
        )
        const totalUsers = cityUsers.filter(
          (user: any) => user.role !== UserRole.ELEITOR
        ).length
        const totalVoters = cityUsers.filter(
          (user: any) => user.role === UserRole.ELEITOR
        ).length

        return {
          id,
          ...data,
          details: {
            ...data.details,
            totalUsers,
            totalVoters
          }
        } as City
      }
    )

    if (filters.name) {
      const searchTerm = filters.name.toLowerCase()
      citiesArray = citiesArray.filter((city) =>
        city.name.toLowerCase().includes(searchTerm)
      )
    }

    return citiesArray
  }

  const createCity = async (
    data: CityRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      const cityData: Partial<City> = {
        name: data.name,
        state: data.state!.toUpperCase(),
        status: data.status,
        details: {
          ibgeCode: data.ibgeCode ?? null,
          observations: data.observations ?? null
        }
      }
      const newCityId = await citiesService.createCity(cityData, user!.id)
      setLoading(false)
      return newCityId
    } catch (error) {
      console.error('Erro ao criar cidade:', error)
      setLoading(false)
      throw error
    }
  }

  const updateCity = async (
    id: string,
    data: Partial<CityRegistrationFormType>
  ): Promise<void> => {
    setLoading(true)
    try {
      const cityData: Partial<City> = {
        status: data.status,
        details: {
          ibgeCode: data.ibgeCode ?? null,
          observations: data.observations ?? null
        }
      }
      await citiesService.updateCity(id, cityData)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao atualizar cidade:', error)
      setLoading(false)
      throw error
    }
  }

  const deleteCity = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await citiesService.deleteCity(id)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao deletar cidade:', error)
      setLoading(false)
      throw error
    }
  }

  const getInitialData = (city: City): Partial<CityRegistrationFormType> => ({
    name: city.name,
    state: city.state,
    status: city.status,
    ibgeCode: city.details.ibgeCode,
    observations: city.details.observations
  })

  return (
    <CitiesContext.Provider
      value={{
        cities,
        loading,
        filters,
        setFilters,
        createCity,
        updateCity,
        deleteCity,
        getInitialData
      }}
    >
      {children}
    </CitiesContext.Provider>
  )
}

export const useCities = () => useContext(CitiesContext)
