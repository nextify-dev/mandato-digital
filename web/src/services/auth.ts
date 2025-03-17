// src/services/auth.ts

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { ref, set, get, remove } from 'firebase/database'
import { auth, db } from '@/lib/firebase'
import {
  User,
  UserRole,
  UserStatus,
  UserRegistrationFormType,
  UserProfile
} from '@/@types/user'
import { handleTranslateFbError } from '@/utils/functions/firebaseTranslateErrors'
import { convertToISODate, removeMask } from '@/utils/functions/masks'

export interface FirstAccessEligibility {
  isEligible: boolean
  isAlreadyRegistered: boolean
  userData?: User
  tempId?: string
}

// Função para gerar um ID temporário único
const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

interface AuthService {
  checkEmailUniqueness(email: string, excludeId?: string): Promise<boolean>
  checkCpfUniqueness(cpf: string, excludeId?: string): Promise<boolean>
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  inviteUser(
    email: string,
    role: Exclude<UserRole, UserRole.PENDENTE | UserRole.ELEITOR>,
    cityId: string
  ): Promise<void>
  completeRegistration(
    email: string,
    data: UserRegistrationFormType,
    mode: 'firstAccess' | 'voterCreation' | 'userCreation',
    cityId: string
  ): Promise<User>
  getUserData(uid: string): Promise<User | null>
  resetPassword(email: string): Promise<void>
  checkFirstAccessEligibility(email: string): Promise<FirstAccessEligibility>
  getPermissionsByRole(role: UserRole): any
  deleteUser(uid: string): Promise<void>
  blockUser(uid: string): Promise<User>
  editUser(
    uid: string,
    updatedData: Partial<UserProfile> & { role?: UserRole; status?: UserStatus }
  ): Promise<User>
}

export const authService: AuthService = {
  async checkEmailUniqueness(
    email: string,
    excludeId?: string
  ): Promise<boolean> {
    console.log(excludeId)
    const snapshot = await get(ref(db, 'users'))
    const users = snapshot.val() || {}
    return !Object.values(users).some(
      (user: any) => user.email === email && user.id !== excludeId
    )
  },

  async checkCpfUniqueness(cpf: string, excludeId?: string): Promise<boolean> {
    const unmaskedCpf = removeMask(cpf)
    const snapshot = await get(ref(db, 'users'))
    const users = snapshot.val() || {}
    return !Object.values(users).some(
      (user: any) => user.profile?.cpf === unmaskedCpf && user.id !== excludeId
    )
  },

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    const userData = await this.getUserData(userCredential.user.uid)
    if (!userData) throw new Error('Usuário não encontrado no banco de dados.')
    if (userData.status === UserStatus.PENDENTE)
      throw new Error('Este usuário ainda não completou o primeiro acesso.')
    if (userData.access.isFirstAccess)
      throw new Error('Primeiro acesso detectado. Complete seu cadastro.')
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
      status: UserStatus.PENDENTE,
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
    data: UserRegistrationFormType,
    mode: 'firstAccess' | 'voterCreation' | 'userCreation',
    cityId: string
  ): Promise<User> {
    const snapshot = await get(ref(db, 'users'))
    const users = snapshot.val() || {}
    let tempId: string | undefined
    let existingUser: User | undefined

    const emailExists = Object.values(users).some(
      (user: any) => user.email === email && user.id !== tempId
    )
    const cpfExists = Object.values(users).some(
      (user: any) =>
        user.profile?.cpf === removeMask(data.cpf) && user.id !== tempId
    )

    if (emailExists) throw new Error('Este email já está registrado')
    if (cpfExists) throw new Error('Este CPF já está registrado')

    if (mode === 'firstAccess') {
      const tempUserEntry = Object.entries(users).find(
        ([, user]: [string, any]) =>
          user.email === email && user.access.isFirstAccess
      )

      if (!tempUserEntry) throw new Error('Convite não encontrado')
      ;[tempId, existingUser] = tempUserEntry as [string, User]
      if (existingUser.role !== UserRole.PENDENTE)
        throw new Error('Este email já foi registrado')
    }

    let role: UserRole
    let status: UserStatus
    if (mode === 'firstAccess') {
      role = data.role || UserRole.ELEITOR
      status = UserStatus.ATIVO
    } else if (mode === 'voterCreation') {
      role = UserRole.ELEITOR
      status = UserStatus.PENDENTE
    } else if (mode === 'userCreation') {
      if (
        !data.role ||
        !Object.values(UserRole).includes(data.role as UserRole)
      )
        throw new Error(
          'Cargo inválido ou não especificado para criação de usuário'
        )
      role = data.role as UserRole
      status = UserStatus.PENDENTE
    } else {
      throw new Error('Modo de registro inválido')
    }

    let uid: string
    if (mode === 'firstAccess') {
      if (!data.password)
        throw new Error('Senha é obrigatória para primeiro acesso')
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        data.password
      )
      uid = userCredential.user.uid
    } else {
      uid = generateTempId()
    }

    const profile: UserProfile = {
      foto: data.foto || null,
      nomeCompleto: data.nomeCompleto,
      cpf: removeMask(data.cpf),
      dataNascimento: convertToISODate(data.dataNascimento),
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
    }

    const permissions = this.getPermissionsByRole(role)

    const updatedUser: User = {
      id: uid,
      email,
      role,
      status,
      cityId,
      createdAt: new Date().toISOString(),
      updatedAt:
        mode === 'firstAccess' && existingUser
          ? existingUser.updatedAt
          : new Date().toISOString(),
      profile,
      access: {
        invitedBy:
          mode === 'firstAccess' && existingUser
            ? existingUser.access.invitedBy
            : auth.currentUser?.uid || null,
        invitationDate:
          mode === 'firstAccess' && existingUser
            ? existingUser.access.invitationDate
            : mode !== 'firstAccess'
            ? new Date().toISOString()
            : null,
        lastLogin: mode === 'firstAccess' ? new Date().toISOString() : null,
        isFirstAccess: mode !== 'firstAccess'
      },
      permissions,
      ...(mode === 'userCreation' &&
        data.creationMode === 'fromVoter' && {
          vereadorId: null,
          caboEleitoralId: null
        })
    }

    const newUserRef = ref(db, `users/${uid}`)
    await set(newUserRef, updatedUser)

    if (mode === 'firstAccess' && tempId) {
      await remove(ref(db, `users/${tempId}`))
    }

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

      if (!userData.access.isFirstAccess) {
        return {
          isEligible: false,
          isAlreadyRegistered: true,
          userData: undefined,
          tempId: undefined
        }
      }

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
      case UserRole.ELEITOR:
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
  },

  // Função de exclusão atualizada
  async deleteUser(uid: string): Promise<void> {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Usuário não autenticado')

    const currentUserData = await this.getUserData(currentUser.uid)
    if (!currentUserData)
      throw new Error('Dados do usuário atual não encontrados')

    const targetUserData = await this.getUserData(uid)
    if (!targetUserData) throw new Error('Usuário alvo não encontrado')

    // Verifica permissões
    if (
      !currentUserData.permissions.canEditUsers ||
      (currentUserData.role === UserRole.ADMINISTRADOR_CIDADE &&
        currentUserData.cityId !== targetUserData.cityId)
    ) {
      throw new Error('Permissão insuficiente para excluir este usuário')
    }

    // Impede exclusão de si mesmo ou de usuários com papéis superiores
    if (currentUser.uid === uid) {
      throw new Error('Você não pode excluir sua própria conta')
    }
    if (
      targetUserData.role === UserRole.ADMINISTRADOR_GERAL &&
      currentUserData.role !== UserRole.ADMINISTRADOR_GERAL
    ) {
      throw new Error('Não é possível excluir um Administrador Geral')
    }

    // Remove apenas do Realtime Database
    const userRef = ref(db, `users/${uid}`)
    await remove(userRef)

    // Espaço reservado para futura lógica de exclusão no Firebase Authentication via backend
    /*
    try {
      // TODO: Implementar chamada ao backend (ex.: Cloud Function) para excluir o usuário no Firebase Authentication
      // Exemplo: await deleteUserFromAuth({ uid });
    } catch (error) {
      console.warn('Erro ao excluir usuário do Firebase Authentication:', error);
    }
    */
  },

  // Nova funcionalidade: Bloquear/Suspender usuário
  async blockUser(uid: string): Promise<User> {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Usuário não autenticado')

    const currentUserData = await this.getUserData(currentUser.uid)
    if (!currentUserData)
      throw new Error('Dados do usuário atual não encontrados')

    const targetUserData = await this.getUserData(uid)
    if (!targetUserData) throw new Error('Usuário alvo não encontrado')

    // Verifica permissões
    if (
      !currentUserData.permissions.canEditUsers ||
      (currentUserData.role === UserRole.ADMINISTRADOR_CIDADE &&
        currentUserData.cityId !== targetUserData.cityId)
    ) {
      throw new Error('Permissão insuficiente para bloquear este usuário')
    }

    // Impede bloqueio de si mesmo ou de usuários com papéis superiores
    if (currentUser.uid === uid) {
      throw new Error('Você não pode bloquear sua própria conta')
    }
    if (
      targetUserData.role === UserRole.ADMINISTRADOR_GERAL &&
      currentUserData.role !== UserRole.ADMINISTRADOR_GERAL
    ) {
      throw new Error('Não é possível bloquear um Administrador Geral')
    }

    const updatedUser: User = {
      ...targetUserData,
      status: UserStatus.SUSPENSO,
      updatedAt: new Date().toISOString()
    }

    const userRef = ref(db, `users/${uid}`)
    await set(userRef, updatedUser)

    return updatedUser
  },

  // Nova funcionalidade: Editar usuário
  async editUser(
    uid: string,
    updatedData: Partial<UserProfile> & { role?: UserRole; status?: UserStatus }
  ): Promise<User> {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Usuário não autenticado')

    const currentUserData = await this.getUserData(currentUser.uid)
    if (!currentUserData)
      throw new Error('Dados do usuário atual não encontrados')

    const targetUserData = await this.getUserData(uid)
    if (!targetUserData) throw new Error('Usuário alvo não encontrado')

    // Verifica permissões
    if (
      !currentUserData.permissions.canEditUsers ||
      (currentUserData.role === UserRole.ADMINISTRADOR_CIDADE &&
        currentUserData.cityId !== targetUserData.cityId)
    ) {
      throw new Error('Permissão insuficiente para editar este usuário')
    }

    // Impede edição de papéis superiores por usuários com menos privilégios
    if (
      updatedData.role &&
      updatedData.role === UserRole.ADMINISTRADOR_GERAL &&
      currentUserData.role !== UserRole.ADMINISTRADOR_GERAL
    ) {
      throw new Error('Não é possível atribuir o papel de Administrador Geral')
    }

    // Atualiza o perfil e/ou papel e/ou status
    const updatedProfile: UserProfile = {
      ...targetUserData.profile!,
      ...(updatedData.nomeCompleto && {
        nomeCompleto: updatedData.nomeCompleto
      }),
      ...(updatedData.cpf && { cpf: removeMask(updatedData.cpf) }),
      ...(updatedData.dataNascimento && {
        dataNascimento: convertToISODate(updatedData.dataNascimento)
      }),
      ...(updatedData.genero && { genero: updatedData.genero }),
      ...(updatedData.religiao !== undefined && {
        religiao: updatedData.religiao || null
      }),
      ...(updatedData.foto !== undefined && { foto: updatedData.foto || null }),
      ...(updatedData.telefone !== undefined && {
        telefone: updatedData.telefone ? removeMask(updatedData.telefone) : null
      }),
      ...(updatedData.whatsapp && {
        whatsapp: removeMask(updatedData.whatsapp)
      }),
      ...(updatedData.instagram !== undefined && {
        instagram: updatedData.instagram || null
      }),
      ...(updatedData.facebook !== undefined && {
        facebook: updatedData.facebook || null
      }),
      ...(updatedData.cep && { cep: removeMask(updatedData.cep) }),
      ...(updatedData.endereco && { endereco: updatedData.endereco }),
      ...(updatedData.numero && { numero: updatedData.numero }),
      ...(updatedData.complemento !== undefined && {
        complemento: updatedData.complemento || null
      }),
      ...(updatedData.bairro && { bairro: updatedData.bairro }),
      ...(updatedData.cidade && { cidade: updatedData.cidade }),
      ...(updatedData.estado && { estado: updatedData.estado })
    }

    const updatedUser: User = {
      ...targetUserData,
      profile: updatedProfile,
      ...(updatedData.role && {
        role: updatedData.role,
        permissions: this.getPermissionsByRole(updatedData.role)
      }),
      ...(updatedData.status && { status: updatedData.status }),
      updatedAt: new Date().toISOString()
    }

    const userRef = ref(db, `users/${uid}`)
    await set(userRef, updatedUser)

    return updatedUser
  }
}
