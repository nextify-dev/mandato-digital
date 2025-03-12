// src/services/auth.ts

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { ref, set, get, update } from 'firebase/database'
import { auth, db } from '@/lib/firebase'
import {
  User,
  UserRole,
  UserStatus,
  FirstAccessForm,
  UserType
} from '@/@types/user'
import { handleTranslateFbError } from '@/utils/functions/firebaseTranslateErrors'

export const authService = {
  // Login
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const userData = await this.getUserData(userCredential.user.uid)
      if (!userData) {
        throw new Error(
          'Usuário não encontrado no banco de dados. Verifique se este é seu primeiro acesso.'
        )
      }
      if (userData.access.isFirstAccess) {
        throw new Error('Primeiro acesso detectado. Complete seu cadastro.')
      }
      return userData
    } catch (error: any) {
      const fbError = handleTranslateFbError(error.code)
      throw new Error(fbError || error.message || 'Erro ao fazer login')
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      const fbError = handleTranslateFbError(error.code)
      throw new Error(fbError || 'Erro ao fazer logout')
    }
  },

  // Convidar usuário (administrador)
  async inviteUser(
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ): Promise<void> {
    try {
      const invitedBy = auth.currentUser?.uid
      if (!invitedBy) throw new Error('Administrador não autenticado')

      const userRef = ref(db, `users/${email.replace('.', '_')}`)
      const snapshot = await get(userRef)
      if (snapshot.exists()) throw new Error('Este email já está registrado')

      const newUser: User = {
        id: email.replace('.', '_'), // Temporário até completar cadastro
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

      await set(userRef, newUser)
    } catch (error: any) {
      const fbError = handleTranslateFbError(error.code)
      throw new Error(fbError || error.message || 'Erro ao convidar usuário')
    }
  },

  // Completar cadastro no primeiro acesso
  async completeRegistration(
    email: string,
    data: FirstAccessForm
  ): Promise<User> {
    try {
      const userRef = ref(db, `users/${email.replace('.', '_')}`)
      const snapshot = await get(userRef)
      if (!snapshot.exists()) throw new Error('Convite não encontrado')
      const userData = snapshot.val() as User
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
          userData.role === UserRole.PENDENTE
            ? UserRole.ELEITOR
            : userData.role,
        status: UserStatus.ATIVO,
        updatedAt: new Date().toISOString(),
        profile: {
          foto: data.foto || null,
          nomeCompleto: data.nomeCompleto,
          cpf: data.cpf,
          dataNascimento: data.dataNascimento,
          genero: data.genero,
          religiao: data.religiao || null,
          telefone: data.telefone || null,
          whatsapp: data.whatsapp,
          instagram: data.instagram || null,
          facebook: data.facebook || null,
          cep: data.cep,
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
        permissions: {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: false,
          canRegisterVoters: false,
          canViewCityMap: false,
          canManageCampaigns: false
        }
      }

      // Atualizar permissões com base no papel
      if (updatedUser.role === UserRole.ADMINISTRADOR_GERAL) {
        updatedUser.permissions = {
          canManageAllCities: true,
          canManageCityUsers: true,
          canEditUsers: true,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      } else if (updatedUser.role === UserRole.ADMINISTRADOR_CIDADE) {
        updatedUser.permissions = {
          canManageAllCities: false,
          canManageCityUsers: true,
          canEditUsers: true,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      } else if (updatedUser.role === UserRole.PREFEITO) {
        updatedUser.permissions = {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      } else if (updatedUser.role === UserRole.VEREADOR) {
        updatedUser.permissions = {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: true,
          canRegisterVoters: true,
          canViewCityMap: true,
          canManageCampaigns: true
        }
      } else if (updatedUser.role === UserRole.CABO_ELEITORAL) {
        updatedUser.permissions = {
          canManageAllCities: false,
          canManageCityUsers: false,
          canEditUsers: false,
          canViewReports: false,
          canRegisterVoters: true,
          canViewCityMap: false,
          canManageCampaigns: false
        }
      }

      await update(userRef, updatedUser)
      return updatedUser
    } catch (error: any) {
      const fbError = handleTranslateFbError(error.code)
      throw new Error(fbError || error.message || 'Erro ao completar cadastro')
    }
  },

  // Obter dados do usuário
  async getUserData(uid: string): Promise<User | null> {
    try {
      const userRef = ref(db, `users/${uid}`)
      const snapshot = await get(userRef)
      if (!snapshot.exists()) return null
      return snapshot.val() as User
    } catch (error: any) {
      const fbError = handleTranslateFbError(error.code)
      throw new Error(fbError || 'Erro ao buscar dados do usuário')
    }
  },

  // Resetar senha
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      const fbError = handleTranslateFbError(error.code)
      throw new Error(fbError || 'Erro ao enviar email de redefinição de senha')
    }
  }
}
