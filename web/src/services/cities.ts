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
import { authService } from '@/services/auth'

interface CityRegistrationFormTypeExtended {
  name: string
  state: string
  status: CityStatus
  ibgeCode?: string | null
  observations?: string | null
  administratorId?: string | null
  mayorId?: string | null
  vereadorIds?: string[]
  caboEleitoralIds?: string[]
}

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

  createCity: async (
    data: Partial<City> & {
      administratorId?: string | null
      mayorId?: string | null
      vereadorIds?: string[]
      caboEleitoralIds?: string[]
    },
    userId: string
  ): Promise<string> => {
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

    // Salvar a cidade no banco
    await set(newCityRef, newCity)

    // Atualizar os usuários com cityId e role
    const roleUpdates: { [userId: string]: UserRole } = {}
    if (data.administratorId) {
      roleUpdates[data.administratorId] = UserRole.ADMINISTRADOR_CIDADE
    }
    if (data.mayorId) {
      roleUpdates[data.mayorId] = UserRole.PREFEITO
    }
    if (data.vereadorIds) {
      data.vereadorIds.forEach((id) => {
        roleUpdates[id] = UserRole.VEREADOR
      })
    }
    if (data.caboEleitoralIds) {
      data.caboEleitoralIds.forEach((id) => {
        roleUpdates[id] = UserRole.CABO_ELEITORAL
      })
    }

    // Atualizar usuários selecionados
    for (const [userId, role] of Object.entries(roleUpdates)) {
      try {
        const userData = await authService.getUserData(userId)
        if (!userData) {
          console.warn(`Usuário ${userId} não encontrado. Pulando atualização.`)
          continue
        }
        await authService.editUser(userId, { role, cityId: newCityId })
      } catch (error) {
        console.error(`Erro ao atualizar usuário ${userId}:`, error)
        throw new Error(`Erro ao atualizar usuário ${userId}`)
      }
    }

    // Reverter usuários não selecionados para Eleitor (somente os que já estavam na cidade, mas isso não se aplica na criação)
    const allSelectedIds = [
      data.administratorId,
      data.mayorId,
      ...(data.vereadorIds || []),
      ...(data.caboEleitoralIds || [])
    ].filter(Boolean) as string[]

    const usersRef = ref(db, 'users')
    const usersSnapshot = await get(usersRef)
    const usersData = usersSnapshot.val() || {}

    // Na criação, não há usuários anteriores para reverter, mas mantemos a lógica para consistência futura
    const cityUsers = Object.values(usersData)
      .filter((user: any) => user.cityId === newCityId)
      .map((user: any) => user.id)

    for (const userId of cityUsers) {
      if (!allSelectedIds.includes(userId)) {
        const userData = usersData[userId]
        if (userData.role !== UserRole.ELEITOR) {
          try {
            await authService.editUser(userId, { role: UserRole.ELEITOR })
          } catch (error) {
            console.error(`Erro ao resetar cargo do usuário ${userId}:`, error)
          }
        }
      }
    }

    return newCityId
  },

  updateCity: async (
    id: string,
    data: Partial<City> & {
      administratorId?: string | null
      mayorId?: string | null
      vereadorIds?: string[]
      caboEleitoralIds?: string[]
    }
  ): Promise<void> => {
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

    // Salvar a atualização da cidade
    await set(cityRef, updatedCity)

    // Atualizar os usuários com cityId e role
    const roleUpdates: { [userId: string]: UserRole } = {}
    if (data.administratorId) {
      roleUpdates[data.administratorId] = UserRole.ADMINISTRADOR_CIDADE
    }
    if (data.mayorId) {
      roleUpdates[data.mayorId] = UserRole.PREFEITO
    }
    if (data.vereadorIds) {
      data.vereadorIds.forEach((id) => {
        roleUpdates[id] = UserRole.VEREADOR
      })
    }
    if (data.caboEleitoralIds) {
      data.caboEleitoralIds.forEach((id) => {
        roleUpdates[id] = UserRole.CABO_ELEITORAL
      })
    }

    // Atualizar usuários selecionados
    for (const [userId, role] of Object.entries(roleUpdates)) {
      try {
        const userData = await authService.getUserData(userId)
        if (!userData) {
          console.warn(`Usuário ${userId} não encontrado. Pulando atualização.`)
          continue
        }
        await authService.editUser(userId, { role, cityId: id })
      } catch (error) {
        console.error(`Erro ao atualizar usuário ${userId}:`, error)
        throw new Error(`Erro ao atualizar usuário ${userId}`)
      }
    }

    // Reverter usuários não selecionados para Eleitor
    const allSelectedIds = [
      data.administratorId,
      data.mayorId,
      ...(data.vereadorIds || []),
      ...(data.caboEleitoralIds || [])
    ].filter(Boolean) as string[]

    const usersRef = ref(db, 'users')
    const usersSnapshot = await get(usersRef)
    const usersData = usersSnapshot.val() || {}

    const cityUsers = Object.values(usersData)
      .filter((user: any) => user.cityId === id)
      .map((user: any) => user.id)

    for (const userId of cityUsers) {
      if (!allSelectedIds.includes(userId)) {
        const userData = usersData[userId]
        if (userData.role !== UserRole.ELEITOR) {
          try {
            await authService.editUser(userId, { role: UserRole.ELEITOR })
          } catch (error) {
            console.error(`Erro ao resetar cargo do usuário ${userId}:`, error)
          }
        }
      }
    }
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
