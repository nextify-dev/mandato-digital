// src/services/cities.ts
import { City, CityStatus } from '@/@types/city'
import { UserRole } from '@/@types/user'
import { db } from '@/lib/firebase'
import {
  ref,
  get,
  set,
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

  getSnapshot: async (reference: any) => {
    return await get(reference)
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

    const citiesSnapshot = await get(q)
    const citiesData = citiesSnapshot.val() || {}

    const usersRef = ref(db, 'users')
    const usersSnapshot = await get(usersRef)
    const usersData = usersSnapshot.val() || {}

    const citiesArray = Object.entries(citiesData).map(
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
        const totalVereadores = cityUsers.filter(
          (user: any) => user.role === UserRole.VEREADOR
        ).length
        const totalCabosEleitorais = cityUsers.filter(
          (user: any) => user.role === UserRole.CABO_ELEITORAL
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

    return citiesArray
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
        ibgeCode: data.details?.ibgeCode || null,
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
        ibgeCode:
          data.details?.ibgeCode || existingCity.details.ibgeCode || null,
        observations:
          data.details?.observations ||
          existingCity.details.observations ||
          null
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
