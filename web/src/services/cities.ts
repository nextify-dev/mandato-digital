// src/services/cities.ts
import { City, CityStatus } from '@/@types/city'
import { db } from '@/lib/firebase'
import {
  ref,
  get,
  set,
  update,
  remove,
  query,
  orderByChild,
  startAt,
  endAt
} from 'firebase/database'

export const citiesService = {
  checkCityNameUniqueness: async (
    name: string,
    currentName?: string
  ): Promise<boolean> => {
    if (name === currentName) return true
    const citiesRef = ref(db, 'cities')
    const snapshot = await get(citiesRef)
    const cities = snapshot.val() || {}
    return !Object.values(cities).some((city: any) => city.name === name)
  },

  getCities: async (filters: Partial<{ name: string }>): Promise<City[]> => {
    const citiesRef = ref(db, 'cities')
    let q = citiesRef

    if (filters.name) {
      q = query(
        citiesRef,
        orderByChild('name'),
        startAt(filters.name),
        endAt(filters.name + '\uf8ff')
      ) as any
    }

    const snapshot = await get(q)
    const citiesData = snapshot.val() || {}
    return Object.entries(citiesData).map(([id, data]: [string, any]) => ({
      id,
      ...data,
      details: {
        ...data.details,
        totalUsers: Math.floor(Math.random() * 1000) // Simulação de totalUsers (não salvo)
      }
    })) as City[]
  },

  createCity: async (data: Partial<City>, userId: string): Promise<string> => {
    const citiesRef = ref(db, 'cities')
    const snapshot = await get(citiesRef)
    const cities = snapshot.val() || {}

    if (Object.values(cities).some((city: any) => city.name === data.name)) {
      throw new Error('Esta cidade já está registrada')
    }

    const newCityId = `city_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const newCityRef = ref(db, `cities/${newCityId}`)

    const newCity: City = {
      id: newCityId,
      name: data.name || '',
      state: data.state || '',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      status: data.status || CityStatus.PENDENTE,
      details: {
        totalVoters: data.details?.totalVoters || null,
        population: data.details?.population || null,
        ibgeCode: data.details?.ibgeCode || null,
        cepRangeStart: data.details?.cepRangeStart || null,
        cepRangeEnd: data.details?.cepRangeEnd || null,
        observations: data.details?.observations || null
      }
    }

    await set(newCityRef, newCity)
    return newCityId
  },

  updateCity: async (id: string, data: Partial<City>): Promise<void> => {
    const cityRef = ref(db, `cities/${id}`)
    const snapshot = await get(cityRef)
    if (!snapshot.exists()) {
      throw new Error('Cidade não encontrada')
    }

    const existingCity = snapshot.val() as City
    const updatedCity: Partial<City> = {
      ...existingCity,
      status: data.status ?? existingCity.status,
      details: {
        totalVoters:
          data.details?.totalVoters ?? existingCity.details.totalVoters,
        population: data.details?.population ?? existingCity.details.population,
        ibgeCode: data.details?.ibgeCode ?? existingCity.details.ibgeCode,
        cepRangeStart:
          data.details?.cepRangeStart ?? existingCity.details.cepRangeStart,
        cepRangeEnd:
          data.details?.cepRangeEnd ?? existingCity.details.cepRangeEnd,
        observations:
          data.details?.observations ?? existingCity.details.observations
      }
    }

    await set(cityRef, updatedCity)
  },

  deleteCity: async (id: string): Promise<void> => {
    const cityRef = ref(db, `cities/${id}`)
    const snapshot = await get(cityRef)
    if (!snapshot.exists()) {
      throw new Error('Cidade não encontrada')
    }

    await remove(cityRef)
  }
}
