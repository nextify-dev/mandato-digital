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
  // Verifica se o nome da cidade é único, excluindo o nome atual (se fornecido)
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

  // Obtém a lista de cidades com filtros opcionais
  getCities: async (filters: Partial<{ name: string }>): Promise<City[]> => {
    const citiesRef = ref(db, 'cities')
    let q = citiesRef

    if (filters.name) {
      // Usando orderByChild e filtros para busca aproximada
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
      ...data
    })) as City[]
  },

  // Cria uma nova cidade
  createCity: async (data: Partial<City>): Promise<string> => {
    const citiesRef = ref(db, 'cities')
    const snapshot = await get(citiesRef)
    const cities = snapshot.val() || {}

    // Verifica unicidade do nome antes de criar
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
      status: data.status || CityStatus.PENDENTE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      details: {
        description: data.details?.description || null,
        totalUsers: data.details?.totalUsers || 0,
        population: data.details?.population || null,
        area: data.details?.area || null,
        cepRangeStart: data.details?.cepRangeStart || null,
        cepRangeEnd: data.details?.cepRangeEnd || null,
        state: data.details?.state || ''
      }
    }

    await set(newCityRef, newCity)
    return newCityId
  },

  // Atualiza uma cidade existente
  updateCity: async (id: string, data: Partial<City>): Promise<void> => {
    const cityRef = ref(db, `cities/${id}`)
    const snapshot = await get(cityRef)
    if (!snapshot.exists()) {
      throw new Error('Cidade não encontrada')
    }

    const existingCity = snapshot.val() as City
    const citiesSnapshot = await get(ref(db, 'cities'))
    const cities = citiesSnapshot.val() || {}

    // Verifica unicidade do nome, se alterado
    if (data.name && data.name !== existingCity.name) {
      if (
        Object.values(cities).some(
          (city: any) => city.name === data.name && city.id !== id
        )
      ) {
        throw new Error('Este nome de cidade já está em uso')
      }
    }

    const updatedCity: Partial<City> = {
      ...existingCity,
      name: data.name ?? existingCity.name,
      status: data.status ?? existingCity.status,
      updatedAt: new Date().toISOString(),
      details: {
        ...existingCity.details,
        description:
          data.details?.description ?? existingCity.details.description,
        totalUsers: data.details?.totalUsers ?? existingCity.details.totalUsers,
        population: data.details?.population ?? existingCity.details.population,
        area: data.details?.area ?? existingCity.details.area,
        cepRangeStart:
          data.details?.cepRangeStart ?? existingCity.details.cepRangeStart,
        cepRangeEnd:
          data.details?.cepRangeEnd ?? existingCity.details.cepRangeEnd,
        state: data.details?.state ?? existingCity.details.state
      }
    }

    await set(cityRef, updatedCity)
  },

  // Deleta uma cidade
  deleteCity: async (id: string): Promise<void> => {
    const cityRef = ref(db, `cities/${id}`)
    const snapshot = await get(cityRef)
    if (!snapshot.exists()) {
      throw new Error('Cidade não encontrada')
    }

    const cityData = snapshot.val() as City
    if (cityData.details.totalUsers > 0) {
      throw new Error(
        'Não é possível excluir uma cidade com usuários associados'
      )
    }

    await remove(cityRef)
  }
}
