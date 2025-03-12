// src/@types/user.ts

// Enums para papéis e status
export enum UserRole {
  ADMINISTRADOR_GERAL = 'Administrador_Geral',
  ADMINISTRADOR_CIDADE = 'Administrador_da_Cidade',
  PREFEITO = 'Prefeito',
  VEREADOR = 'Vereador',
  CABO_ELEITORAL = 'Cabo_Eleitoral',
  ELEITOR = 'Eleitor',
  PENDENTE = 'Pendente'
}

export enum UserStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  SUSPENSO = 'suspenso'
}

// Interface base para dados comuns a todos os usuários
interface BaseUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// Interface para informações de perfil (completadas no primeiro acesso ou cadastro)
export interface UserProfile {
  foto?: string | null
  nomeCompleto: string
  cpf: string
  dataNascimento: string
  genero: string
  religiao?: string | null
  telefone?: string | null
  whatsapp: string
  instagram?: string | null
  facebook?: string | null
  cep: string
  endereco: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  estado: string
}

// Interface para informações de acesso
interface AccessInfo {
  invitedBy?: string | null
  invitationDate?: string | null
  lastLogin?: string | null
  isFirstAccess: boolean
}

// Interface para permissões específicas por papel
export interface Permissions {
  canManageAllCities?: boolean
  canManageCityUsers?: boolean
  canEditUsers?: boolean
  canViewReports?: boolean
  canRegisterVoters?: boolean
  canViewCityMap?: boolean
  canManageCampaigns?: boolean
}

// Interface principal do usuário
export interface User extends BaseUser {
  cityId: string
  vereadorId?: string | null
  caboEleitoralId?: string | null
  profile?: UserProfile | null
  access: AccessInfo
  permissions: Permissions
}

// Tipos específicos para cada papel (opcional, para maior especificidade)
export interface AdministradorGeral extends User {
  role: UserRole.ADMINISTRADOR_GERAL
  permissions: {
    canManageAllCities: true
    canManageCityUsers: true
    canEditUsers: true
    canViewReports: true
    canRegisterVoters: true
    canViewCityMap: true
    canManageCampaigns: true
  }
}

export interface AdministradorCidade extends User {
  role: UserRole.ADMINISTRADOR_CIDADE
  permissions: {
    canManageAllCities: false
    canManageCityUsers: true
    canEditUsers: true
    canViewReports: true
    canRegisterVoters: true
    canViewCityMap: true
    canManageCampaigns: true
  }
}

export interface Prefeito extends User {
  role: UserRole.PREFEITO
  permissions: {
    canManageAllCities: false
    canManageCityUsers: false
    canEditUsers: false
    canViewReports: true
    canRegisterVoters: true
    canViewCityMap: true
    canManageCampaigns: true
  }
}

export interface Vereador extends User {
  role: UserRole.VEREADOR
  permissions: {
    canManageAllCities: false
    canManageCityUsers: false
    canEditUsers: false
    canViewReports: true
    canRegisterVoters: true
    canViewCityMap: true
    canManageCampaigns: true
  }
}

export interface CaboEleitoral extends User {
  role: UserRole.CABO_ELEITORAL
  permissions: {
    canManageAllCities: false
    canManageCityUsers: false
    canEditUsers: false
    canViewReports: false
    canRegisterVoters: true
    canViewCityMap: false
    canManageCampaigns: false
  }
}

export interface Eleitor extends User {
  role: UserRole.ELEITOR
  permissions: {
    canManageAllCities: false
    canManageCityUsers: false
    canEditUsers: false
    canViewReports: false
    canRegisterVoters: false
    canViewCityMap: false
    canManageCampaigns: false
  }
}

export interface Pendente extends User {
  role: UserRole.PENDENTE
  profile: null
  permissions: {
    canManageAllCities: false
    canManageCityUsers: false
    canEditUsers: false
    canViewReports: false
    canRegisterVoters: false
    canViewCityMap: false
    canManageCampaigns: false
  }
}

// Tipo unificado para todos os usuários
export type UserType =
  | AdministradorGeral
  | AdministradorCidade
  | Prefeito
  | Vereador
  | CaboEleitoral
  | Eleitor
  | Pendente

// Formulário de primeiro acesso (usando Yup para validação)
import * as yup from 'yup'

export const FirstAccessSchema = yup.object({
  foto: yup.mixed().nullable().optional(),
  nomeCompleto: yup.string().required('Nome completo é obrigatório'),
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .matches(
      /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      'CPF deve estar no formato 000.000.000-00'
    )
    .test('cpf-valido', 'CPF inválido', (value) => {
      if (!value) return false
      const cpfNumerico = value.replace(/\D/g, '')
      return cpfNumerico.length === 11
    }),
  dataNascimento: yup
    .string()
    .required('Data de nascimento é obrigatória')
    .test('idade-minima', 'Você deve ter pelo menos 18 anos', (value) => {
      const date = new Date(value)
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age >= 18
    }),
  genero: yup.string().required('Gênero é obrigatório'),
  religiao: yup.string().nullable().optional(),
  telefone: yup
    .string()
    .matches(
      /^\(\d{2}\) \d \d{4} \d{4}$/,
      'Telefone deve estar no formato (00) 0 0000 0000'
    )
    .nullable()
    .optional(),
  whatsapp: yup
    .string()
    .required('WhatsApp é obrigatório')
    .matches(
      /^\(\d{2}\) \d \d{4} \d{4}$/,
      'WhatsApp deve estar no formato (00) 0 0000 0000'
    ),
  instagram: yup.string().nullable().optional(),
  facebook: yup.string().nullable().optional(),
  cep: yup
    .string()
    .required('CEP é obrigatório')
    .matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 00000-000'),
  endereco: yup.string().required('Endereço é obrigatório'),
  numero: yup.string().required('Número é obrigatório'),
  complemento: yup.string().nullable().optional(),
  bairro: yup.string().required('Bairro é obrigatório'),
  cidade: yup.string().required('Cidade é obrigatória'),
  estado: yup.string().required('Estado é obrigatório'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  password: yup
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: yup
    .string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('password')], 'As senhas devem coincidir')
})

export type FirstAccessForm = yup.InferType<typeof FirstAccessSchema>
