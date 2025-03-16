// src/contexts/CitiesProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { City, CityRegistrationFormType } from '@/@types/city'
import { citiesService } from '@/services/cities'
import { useAuth } from '@/contexts/AuthProvider'

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
    fetchCities()
  }, [filters])

  const fetchCities = async () => {
    setLoading(true)
    try {
      const fetchedCities = await citiesService.getCities(filters)
      setCities(fetchedCities)
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCity = async (
    data: CityRegistrationFormType
  ): Promise<string> => {
    setLoading(true)
    try {
      const cityData: Partial<City> = {
        name: data.name,
        state: data.state.toUpperCase(),
        status: data.status,
        details: {
          totalVoters: data.totalVoters,
          population: data.population,
          ibgeCode: data.ibgeCode,
          cepRangeStart: data.cepRangeStart,
          cepRangeEnd: data.cepRangeEnd,
          observations: data.observations
        }
      }
      const newCityId = await citiesService.createCity(cityData, user!.id)
      await fetchCities()
      return newCityId
    } catch (error) {
      console.error('Erro ao criar cidade:', error)
      throw error
    } finally {
      setLoading(false)
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
          totalVoters: data.totalVoters,
          population: data.population,
          ibgeCode: data.ibgeCode,
          cepRangeStart: data.cepRangeStart,
          cepRangeEnd: data.cepRangeEnd,
          observations: data.observations
        }
      }
      await citiesService.updateCity(id, cityData)
      await fetchCities()
    } catch (error) {
      console.error('Erro ao atualizar cidade:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteCity = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await citiesService.deleteCity(id)
      await fetchCities()
    } catch (error) {
      console.error('Erro ao deletar cidade:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getInitialData = (city: City): Partial<CityRegistrationFormType> => ({
    name: city.name,
    state: city.state,
    status: city.status,
    totalVoters: city.details.totalVoters,
    population: city.details.population,
    ibgeCode: city.details.ibgeCode,
    cepRangeStart: city.details.cepRangeStart,
    cepRangeEnd: city.details.cepRangeEnd,
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
