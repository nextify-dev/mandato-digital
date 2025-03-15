// src/contexts/CitiesProvider.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { City, CityRegistrationFormType } from '@/@types/city'
import { citiesService } from '@/services/cities'

interface CitiesContextData {
  cities: City[]
  loading: boolean
  filters: Partial<CityFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<CityFilters>>>
  createCity: (data: CityRegistrationFormType) => Promise<string>
  updateCity: (id: string, data: CityRegistrationFormType) => Promise<void>
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
        status: data.status,
        details: {
          description: data.description,
          totalUsers: data.totalUsers || 0,
          population: data.population,
          area: data.area,
          cepRangeStart: data.cepRangeStart,
          cepRangeEnd: data.cepRangeEnd,
          state: data.state
        }
      }
      const newCityId = await citiesService.createCity(cityData)
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
    data: CityRegistrationFormType
  ): Promise<void> => {
    setLoading(true)
    try {
      const cityData: Partial<City> = {
        name: data.name,
        status: data.status,
        details: {
          description: data.description,
          totalUsers: data.totalUsers || 0,
          population: data.population,
          area: data.area,
          cepRangeStart: data.cepRangeStart,
          cepRangeEnd: data.cepRangeEnd,
          state: data.state
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
    status: city.status,
    description: city.details.description,
    totalUsers: city.details.totalUsers,
    population: city.details.population,
    area: city.details.area,
    cepRangeStart: city.details.cepRangeStart,
    cepRangeEnd: city.details.cepRangeEnd,
    state: city.details.state
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
