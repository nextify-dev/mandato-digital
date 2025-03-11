// src/@types/user.ts

// Enum para os possíveis papéis (roles) dos usuários
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PENDING = 'pending'
}

// Enum para status do usuário
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Interface base para informações comuns a todos os usuários
interface BaseUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// Interface para dados adicionais do usuário (completados no primeiro acesso)
interface UserProfile {
  firstName: string
  lastName: string
  displayName?: string
  phone?: string
  avatarUrl?: string
}

// Interface para informações de acesso
interface AccessInfo {
  invitedBy?: string
  invitationDate?: string
  lastLogin?: string
}

// Interface principal do usuário
export interface User extends BaseUser {
  profile?: UserProfile
  access: AccessInfo
}

// Interface específica para o usuário administrador
export interface AdminUser extends User {
  role: UserRole.ADMIN
  permissions: {
    canManageUsers: true
    canEditSettings: true
    canViewReports: true
  }
}

// Tipo para usuário pendente (após convite mas antes do primeiro acesso)
export interface PendingUser extends BaseUser {
  role: UserRole.PENDING
  profile: null
}

// Tipo para formulário de convite
export interface InviteUserForm {
  email: string
  role: Exclude<UserRole, UserRole.PENDING>
}

// Tipo para formulário de conclusão de cadastro
export interface CompleteRegistrationForm {
  firstName: string
  lastName: string
  phone?: string
  password: string
}

// Tipo utilitário para diferenciar os tipos de usuário
export type UserType = AdminUser | User | PendingUser
