// src/services/auth.ts

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { ref, set, get, remove } from 'firebase/database'
import { auth, db } from '@/lib/firebase'

import { User, UserRole, UserStatus, FirstAccessForm } from '@/@types/user'
import { handleTranslateFbError } from '@/utils/functions/firebaseTranslateErrors'
import { removeMask } from '@/utils/functions/masks'

export interface FirstAccessEligibility {
  isEligible: boolean
  isAlreadyRegistered: boolean
  userData?: User
  tempId?: string
}

// Função para gerar um ID temporário único
const generateTempId = (): string => {
  return `voter_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    const userData = await this.getUserData(userCredential.user.uid)
    if (!userData) {
      throw new Error('Usuário não encontrado no banco de dados.')
    }
    if (userData.access.isFirstAccess) {
      throw new Error('Primeiro acesso detectado. Complete seu cadastro.')
    }
    return userData
  },

  async logout(): Promise<void> {
    await signOut(auth)
  },

  async inviteUser(
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ): Promise<void> {
    const invitedBy = auth.currentUser?.uid
    if (!invitedBy) throw new Error('Administrador não autenticado')

    const tempId = generateTempId()
    const userRef = ref(db, `users/${tempId}`)

    const newUser: User = {
      id: tempId,
      email,
      role: UserRole.PENDENTE,
      status: UserStatus.INATIVO,
      cityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      access: {
        invitedBy,
        invitationDate: new Date().toISOString(),
        isFirstAccess: true
      },
      permissions: {
        canManageAllCities: false,
        canManageCityUsers: false,
        canEditUsers: false,
        canViewReports: false,
        canRegisterVoters: false,
        canViewCityMap: false,
        canManageCampaigns: false
      },
      profile: null
    }

    const snapshot = await get(ref(db, `users`))
    const users = snapshot.val() || {}
    if (Object.values(users).some((user: any) => user.email === email)) {
      throw new Error('Este email já está registrado')
    }

    await set(userRef, newUser)
  },

  async completeRegistration(
    email: string,
    data: FirstAccessForm
  ): Promise<User> {
    const snapshot = await get(ref(db, 'users'))
    const users = snapshot.val() || {}
    const tempUserEntry = Object.entries(users).find(
      ([, user]: [string, any]) =>
        user.email === email && user.access.isFirstAccess
    )

    if (!tempUserEntry) throw new Error('Convite não encontrado')
    const [tempId, userData] = tempUserEntry as [string, User]
    if (userData.role !== UserRole.PENDENTE) {
      throw new Error('Este email já foi registrado')
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      data.password
    )
    const uid = userCredential.user.uid

    const updatedUser: User = {
      ...userData,
      id: uid,
      role:
        userData.role === UserRole.PENDENTE ? UserRole.ELEITOR : userData.role,
      status: UserStatus.ATIVO,
      updatedAt: new Date().toISOString(),
      profile: {
        foto: data.foto || null,
        nomeCompleto: data.nomeCompleto,
        cpf: removeMask(data.cpf),
        dataNascimento: removeMask(data.dataNascimento),
        genero: data.genero,
        religiao: data.religiao || null,
        telefone: data.telefone ? removeMask(data.telefone) : null,
        whatsapp: removeMask(data.whatsapp),
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        cep: removeMask(data.cep),
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado
      },
      access: {
        ...userData.access,
        isFirstAccess: false,
        lastLogin: new Date().toISOString()
      },
      permissions: this.getPermissionsByRole(userData.role)
    }

    const newUserRef = ref(db, `users/${uid}`)
    await set(newUserRef, updatedUser)
    await remove(ref(db, `users/${tempId}`))

    return updatedUser
  },

  async getUserData(uid: string): Promise<User | null> {
    const userRef = ref(db, `users/${uid}`)
    const snapshot = await get(userRef)
    return snapshot.exists() ? (snapshot.val() as User) : null
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email)
  },

  async checkFirstAccessEligibility(
    email: string
  ): Promise<FirstAccessEligibility> {
    try {
      const snapshot = await get(ref(db, 'users'))
      const users = snapshot.val() || {}
      const userEntry = Object.entries(users).find(
        ([, user]: [string, any]) => user.email === email
      )

      if (!userEntry) {
        return { isEligible: false, isAlreadyRegistered: false }
      }

      const [tempId, userData] = userEntry as [string, User]

      // Usuário já registrado (não é primeiro acesso)
      if (!userData.access.isFirstAccess) {
        return {
          isEligible: false,
          isAlreadyRegistered: true,
          userData: undefined,
          tempId: undefined
        }
      }

      // Usuário com primeiro acesso pendente
      return {
        isEligible: true,
        isAlreadyRegistered: false,
        userData,
        tempId
      }
    } catch (error) {
      console.error(
        'Erro ao verificar elegibilidade para primeiro acesso:',
        error
      )
      return { isEligible: false, isAlreadyRegistered: false }
    }
  },

  getPermissionsByRole(role: UserRole) {
    switch (role) {
      case UserRole.ADMINISTRADOR_GERAL:
        return {
          canManageAllCities: true,
          canManageCityUsers: true,
          canEditUsers: true,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      case UserRole.ADMINISTRADOR_CIDADE:
        return {
          canManageAllCities: false,
          canManageCityUsers: true,
          canEditUsers: true,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      case UserRole.PREFEITO:
      case UserRole.VEREADOR:
        return {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      case UserRole.CABO_ELEITORAL:
        return {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: false,
          canRegisterVoters: true,
          canViewCityMap: false,
          canManageCampaigns: false
        }
      default:
        return {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: false,
          canRegisterVoters: false,
          canViewCityMap: false,
          canManageCampaigns: false
        }
    }
  }
}
