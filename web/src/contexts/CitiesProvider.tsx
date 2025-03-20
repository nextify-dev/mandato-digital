import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { City, CityRegistrationFormType, CityStatus } from '@/@types/city'
import { citiesService } from '@/services/cities'
import { useAuth } from '@/contexts/AuthProvider'
import { db } from '@/lib/firebase'
import { ref, onValue, get } from 'firebase/database'
import { UserRole, User } from '@/@types/user'

interface CitiesContextData {
  cities: City[]
  loading: boolean
  filters: Partial<CityFilters>
  setFilters: React.Dispatch<React.SetStateAction<Partial<CityFilters>>>
  createCity: (data: CityRegistrationFormTypeExtended) => Promise<string>
  updateCity: (
    id: string,
    data: Partial<CityRegistrationFormTypeExtended>
  ) => Promise<void>
  deleteCity: (id: string) => Promise<void>
  getInitialData: (
    city: City
  ) => Promise<Partial<CityRegistrationFormTypeExtended>>
  getCityById: (cityId?: string) => City | null
}

interface CityRegistrationFormTypeExtended extends CityRegistrationFormType {
  administratorId?: string | null
  mayorId?: string | null
  vereadorIds?: string[]
  caboEleitoralIds?: string[]
}

interface CityFilters {
  name: string
  status?: CityStatus
  state?: string
}

const CitiesContext = createContext<CitiesContextData>({} as CitiesContextData)

export const CitiesProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Partial<CityFilters>>({})

  useEffect(() => {
    const citiesRef = ref(db, 'cities')
    const usersRef = ref(db, 'users')
    setLoading(true)

    const updateCities = async () => {
      const snapshot = await get(citiesRef)
      const citiesData = snapshot.val() || {}
      const citiesArray = await processCitiesData(citiesData, filters)
      setCities(citiesArray)
      setLoading(false)
    }

    const unsubscribeCities = onValue(
      citiesRef,
      async (snapshot) => {
        const citiesData = snapshot.val() || {}
        const citiesArray = await processCitiesData(citiesData, filters)
        setCities(citiesArray)
        setLoading(false)
      },
      (error) => {
        messageApi.error(
          'Erro ao carregar cidades, tente reiniciar a página ou contacte um administrador'
        )
        setLoading(false)
      }
    )

    const unsubscribeUsers = onValue(usersRef, () => {
      updateCities()
    })

    updateCities().catch((error) => {
      messageApi.error(
        'Erro ao carregar cidades iniciais, tente reiniciar a página ou contacte um administrador'
      )
      setLoading(false)
    })

    return () => {
      unsubscribeCities()
      unsubscribeUsers()
    }
  }, [filters, messageApi])

  const processCitiesData = async (
    citiesData: { [key: string]: any },
    filters: Partial<CityFilters>
  ): Promise<City[]> => {
    const usersRef = ref(db, 'users')
    const usersSnapshot = await citiesService.getSnapshot(usersRef)
    const usersData = (usersSnapshot.val() || {}) as { [key: string]: User }

    let citiesArray = Object.entries(citiesData).map(
      ([id, data]: [string, any]) => {
        const cityUsers = Object.values(usersData).filter(
          (user) => user.cityId === id
        )
        const totalUsers = cityUsers.filter(
          (user) => user.role !== UserRole.ELEITOR
        ).length
        const totalVoters = cityUsers.filter(
          (user) => user.role === UserRole.ELEITOR
        ).length
        const totalVereadores = cityUsers.filter(
          (user) => user.role === UserRole.VEREADOR
        ).length
        const totalCabosEleitorais = cityUsers.filter(
          (user) => user.role === UserRole.CABO_ELEITORAL
        ).length

        return {
          id,
          ...data,
          details: {
            ...data.details,
            totalUsers,
            totalVoters,
            totalVereadores,
            totalCabosEleitorais
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
    if (filters.status) {
      citiesArray = citiesArray.filter((city) => city.status === filters.status)
    }
    if (filters.state) {
      citiesArray = citiesArray.filter((city) => city.state === filters.state)
    }

    return citiesArray
  }

  const createCity = async (
    data: CityRegistrationFormTypeExtended
  ): Promise<string> => {
    setLoading(true)
    try {
      if (!user) throw new Error('Usuário não autenticado')
      const newCityId = await citiesService.createCity(data, user.id)
      messageApi.success('Cidade criada com sucesso!')
      setLoading(false)
      return newCityId
    } catch (error: any) {
      messageApi.error('Erro ao criar cidade, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const updateCity = async (
    id: string,
    data: Partial<CityRegistrationFormTypeExtended>
  ): Promise<void> => {
    setLoading(true)
    try {
      await citiesService.updateCity(id, data)
      messageApi.success('Cidade atualizada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao atualizar cidade, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const deleteCity = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await citiesService.deleteCity(id)
      messageApi.success('Cidade deletada com sucesso!')
      setLoading(false)
    } catch (error: any) {
      messageApi.error('Erro ao deletar cidade, tente novamente')
      setLoading(false)
      throw error
    }
  }

  const getInitialData = async (
    city: City
  ): Promise<Partial<CityRegistrationFormTypeExtended>> => {
    const usersRef = ref(db, 'users')
    const usersSnapshot = await citiesService.getSnapshot(usersRef)
    const usersData = (usersSnapshot.val() || {}) as { [key: string]: User }

    const cityUsers = Object.values(usersData).filter(
      (user) => user.cityId === city.id
    )

    const administratorId =
      cityUsers.find((user) => user.role === UserRole.ADMINISTRADOR_CIDADE)
        ?.id || null
    const mayorId =
      cityUsers.find((user) => user.role === UserRole.PREFEITO)?.id || null
    const vereadorIds = cityUsers
      .filter((user) => user.role === UserRole.VEREADOR)
      .map((user) => user.id)
    const caboEleitoralIds = cityUsers
      .filter((user) => user.role === UserRole.CABO_ELEITORAL)
      .map((user) => user.id)

    return {
      name: city.name,
      state: city.state,
      status: city.status,
      ibgeCode: city.details.ibgeCode,
      observations: city.details.observations,
      administratorId,
      mayorId,
      vereadorIds: vereadorIds.length > 0 ? vereadorIds : [],
      caboEleitoralIds: caboEleitoralIds.length > 0 ? caboEleitoralIds : []
    }
  }

  const getCityById = (cityId?: string): City | null => {
    return cities.find((city) => city.id === cityId) || null
  }

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
        getInitialData,
        getCityById
      }}
    >
      {contextHolder}
      {children}
    </CitiesContext.Provider>
  )
}

export const useCities = () => useContext(CitiesContext)
