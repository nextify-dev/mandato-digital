// src/services/voters.ts

import { ref, set, get, update, remove } from 'firebase/database'

import { db } from '@/lib/firebase'
import { User, UserRole } from '@/@types/user'
import { handleTranslateFbError } from '@/utils/functions/firebaseTranslateErrors'

export interface VoterFilter {
  search?: string
  city?: string
  gender?: string
}

export const voterService = {
  async fetchVoters(filter: VoterFilter = {}): Promise<User[]> {
    try {
      const snapshot = await get(ref(db, 'users'))
      const users = snapshot.val() || {}
      const allUsers = Object.entries(users).map(
        ([id, user]: [string, any]) => ({
          ...user,
          id
        })
      ) as User[]

      // Filtra apenas eleitores
      let voters = allUsers.filter((user) => user.role === UserRole.ELEITOR)

      // Aplica filtros adicionais
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        voters = voters.filter(
          (voter) =>
            voter.profile?.nomeCompleto.toLowerCase().includes(searchLower) ||
            voter.profile?.cpf.includes(searchLower) ||
            voter.profile?.telefone?.includes(searchLower)
        )
      }
      if (filter.city) {
        voters = voters.filter((voter) => voter.cityId === filter.city)
      }
      if (filter.gender) {
        voters = voters.filter(
          (voter) => voter.profile?.genero === filter.gender
        )
      }

      return voters
    } catch (error: any) {
      throw new Error(
        handleTranslateFbError(error.code) || 'Erro ao buscar eleitores'
      )
    }
  },

  async createVoter(voterData: Partial<User>): Promise<void> {
    try {
      const newVoterId = `voter_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`
      const voterRef = ref(db, `users/${newVoterId}`)
      const voter: User = {
        ...voterData,
        id: newVoterId,
        role: UserRole.ELEITOR,
        status: 'ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        access: { isFirstAccess: false },
        permissions: {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: false,
          canRegisterVoters: false,
          canViewCityMap: false,
          canManageCampaigns: false
        }
      } as User
      await set(voterRef, voter)
    } catch (error: any) {
      throw new Error(
        handleTranslateFbError(error.code) || 'Erro ao criar eleitor'
      )
    }
  },

  async updateVoter(voterId: string, updates: Partial<User>): Promise<void> {
    try {
      const voterRef = ref(db, `users/${voterId}`)
      await update(voterRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
    } catch (error: any) {
      throw new Error(
        handleTranslateFbError(error.code) || 'Erro ao atualizar eleitor'
      )
    }
  },

  async deleteVoter(voterId: string): Promise<void> {
    try {
      const voterRef = ref(db, `users/${voterId}`)
      await remove(voterRef)
    } catch (error: any) {
      throw new Error(
        handleTranslateFbError(error.code) || 'Erro ao excluir eleitor'
      )
    }
  },

  async toggleVoterStatus(
    voterId: string,
    currentStatus: string
  ): Promise<void> {
    try {
      const voterRef = ref(db, `users/${voterId}`)
      const newStatus = currentStatus === 'ativo' ? 'suspenso' : 'ativo'
      await update(voterRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
    } catch (error: any) {
      throw new Error(
        handleTranslateFbError(error.code) ||
          'Erro ao alterar status do eleitor'
      )
    }
  }
}
