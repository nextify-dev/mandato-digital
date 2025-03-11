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
  InviteUserForm,
  CompleteRegistrationForm
} from '@/@types/user'

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
      if (!userData) throw new Error('Usuário não encontrado no banco de dados')
      return userData
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login')
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error('Erro ao fazer logout')
    }
  },

  // Convidar usuário (administrador)
  async inviteUser({ email, role }: InviteUserForm): Promise<void> {
    try {
      const invitedBy = auth.currentUser?.uid
      if (!invitedBy) throw new Error('Administrador não autenticado')

      const userRef = ref(db, `users/${email.replace('.', '_')}`)
      const snapshot = await get(userRef)
      if (snapshot.exists()) throw new Error('Este email já está registrado')

      await set(userRef, {
        id: email.replace('.', '_'),
        email,
        role: UserRole.PENDING,
        status: UserStatus.INACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        access: {
          invitedBy,
          invitationDate: new Date().toISOString()
        },
        profile: null
      })
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao convidar usuário')
    }
  },

  // Completar cadastro no primeiro acesso
  async completeRegistration(
    email: string,
    { firstName, lastName, phone, password }: CompleteRegistrationForm
  ): Promise<User> {
    try {
      const userRef = ref(db, `users/${email.replace('.', '_')}`)
      const snapshot = await get(userRef)
      if (!snapshot.exists()) throw new Error('Convite não encontrado')
      const userData = snapshot.val()
      if (userData.role !== UserRole.PENDING)
        throw new Error('Este email já foi registrado')

      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const uid = userCredential.user.uid

      // Atualizar dados no Realtime Database
      const updatedUser: User = {
        ...userData,
        id: uid,
        role: UserRole.USER, // ou outro role definido no convite
        status: UserStatus.ACTIVE,
        updatedAt: new Date().toISOString(),
        profile: {
          firstName,
          lastName,
          phone
        }
      }
      await update(userRef, updatedUser)

      return updatedUser
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao completar cadastro')
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
      throw new Error('Erro ao buscar dados do usuário')
    }
  },

  // Resetar senha
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error('Erro ao enviar email de redefinição de senha')
    }
  }
}
