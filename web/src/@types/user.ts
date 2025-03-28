// src/@types/user.ts
import { GENDER_OPTIONS, RELIGION_OPTIONS } from '@/data/options'
import { authService } from '@/services/auth'
import { convertToISODate, isValidCpf } from '@/utils/functions/masks'
import * as yup from 'yup'

export interface FormattedUserTag {
  label: string
  color: string
}

export enum UserRole {
  ADMINISTRADOR_GERAL = 'Administrador_Geral',
  ADMINISTRADOR_CIDADE = 'Administrador_da_Cidade',
  PREFEITO = 'Prefeito',
  VEREADOR = 'Vereador',
  CABO_ELEITORAL = 'Cabo_Eleitoral',
  ELEITOR = 'Eleitor'
}

export const getRoleData = (role?: UserRole): FormattedUserTag => {
  switch (role) {
    case UserRole.ADMINISTRADOR_GERAL:
      return { label: 'Admin. Geral', color: '#1E90FF' }
    case UserRole.ADMINISTRADOR_CIDADE:
      return { label: 'Admin. da Cidade', color: '#4682B4' }
    case UserRole.PREFEITO:
      return { label: 'Prefeito', color: '#2E8B57' }
    case UserRole.VEREADOR:
      return { label: 'Vereador', color: '#228B22' }
    case UserRole.CABO_ELEITORAL:
      return { label: 'Cabo Eleitoral', color: '#DAA520' }
    case UserRole.ELEITOR:
      return { label: 'Eleitor', color: '#696969' }
    default:
      return { label: 'Desconhecido', color: '#808080' }
  }
}

export enum UserStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  SUSPENSO = 'suspenso',
  PENDENTE = 'pendente'
}

export const getStatusData = (status?: UserStatus): FormattedUserTag => {
  switch (status) {
    case UserStatus.ATIVO:
      return { label: 'Ativo', color: '#2E8B57' }
    case UserStatus.INATIVO:
      return { label: 'Inativo', color: '#808080' }
    case UserStatus.SUSPENSO:
      return { label: 'Bloqueado', color: '#FF4500' }
    case UserStatus.PENDENTE:
      return { label: 'Pendente', color: '#FFA500' }
    default:
      return { label: 'Desconhecido', color: '#808080' }
  }
}

interface BaseUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  cityId: string
}

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

interface AccessInfo {
  invitedBy?: string | null
  invitationDate?: string | null
  lastLogin?: string | null
  isFirstAccess: boolean
}

export interface Permissions {
  canManageAllCities?: boolean
  canManageCityUsers?: boolean
  canEditUsers?: boolean
  canViewReports?: boolean
  canRegisterVoters?: boolean
  canViewCityMap?: boolean
  canManageCampaigns?: boolean
}

export interface User extends BaseUser {
  vereadorId?: string | null
  caboEleitoralId?: string | null
  profile?: UserProfile | null
  access: AccessInfo
  permissions: Permissions
}

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

export type UserType =
  | AdministradorGeral
  | AdministradorCidade
  | Prefeito
  | Vereador
  | CaboEleitoral
  | Eleitor

export interface UserRegistrationForm {
  email: string
  nomeCompleto: string
  cpf: string
  dataNascimento: string
  genero: string
  religiao?: string | null
  foto?: string | null
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
  cityId?: string
  password?: string
  confirmPassword?: string
  observacoes?: string
  role?: UserRole
  creationMode?: 'fromScratch' | 'fromVoter'
  voterId?: string
}

export type FormMode =
  | 'firstAccess'
  | 'voterCreation'
  | 'userCreation'
  | 'viewOnly'

export const getUserRegistrationSchema = (
  mode: FormMode,
  isEdition: boolean,
  excludeId?: string
) => {
  return yup.object().shape({
    email: yup.string().when('creationMode', ([creationMode], schema) => {
      if (
        mode === 'userCreation' &&
        creationMode === 'fromVoter' &&
        !isEdition
      ) {
        return schema.notRequired() // Sem validação no modo fromVoter
      }
      return schema
        .email('E-mail inválido')
        .required('E-mail é obrigatório')
        .test(
          'unique-email',
          'Este email já está registrado',
          async (value: string | undefined): Promise<boolean> => {
            if (!value || mode === 'firstAccess' || isEdition) return true
            return await authService.checkEmailUniqueness(value, excludeId)
          }
        )
    }),
    nomeCompleto: yup.string().required('Nome completo é obrigatório'),
    cpf: yup.string().when('creationMode', ([creationMode], schema) => {
      if (
        mode === 'userCreation' &&
        creationMode === 'fromVoter' &&
        !isEdition
      ) {
        return schema.notRequired() // Sem validação no modo fromVoter
      }
      return schema
        .required('CPF é obrigatório')
        .matches(
          /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
          'CPF deve estar no formato 000.000.000-00'
        )
        .test('cpf-valido', 'CPF inválido', (value) => {
          if (!value) return false
          return isValidCpf(value)
        })
        .test('unique-cpf', 'Este CPF já está registrado', async (value) => {
          if (!value || mode === 'firstAccess' || isEdition) return true
          return await authService.checkCpfUniqueness(value, excludeId)
        })
    }),
    dataNascimento: yup
      .string()
      .required('Data de nascimento é obrigatória')
      .matches(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA')
      .test('idade-minima', 'Você deve ter pelo menos 18 anos', (value) => {
        if (!value) return false
        const isoDate = convertToISODate(value)
        const date = new Date(isoDate)
        const today = new Date()
        const age = today.getFullYear() - date.getFullYear()
        return age >= 18
      }),
    genero: yup
      .string()
      .required('Gênero é obrigatório')
      .oneOf(
        GENDER_OPTIONS.map((opt) => opt.value),
        'Selecione um gênero válido'
      ),
    religiao: yup
      .string()
      .nullable()
      .optional()
      .oneOf(
        RELIGION_OPTIONS.map((opt) => opt.value).concat(null as any),
        'Selecione uma religião válida'
      ),
    foto: yup.string().nullable().optional(),
    telefone: yup
      .string()
      .matches(/^\(\d{2}\) \d{5}-\d{4}$/, {
        message: 'Telefone deve estar no formato (00) 12345-6789',
        excludeEmptyString: true
      })
      .nullable()
      .optional(),
    whatsapp: yup
      .string()
      .required('WhatsApp é obrigatório')
      .matches(
        /^\(\d{2}\) \d{5}-\d{4}$/,
        'WhatsApp deve estar no formato (00) 12345-6789'
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
    cityId: yup.string().nullable().optional(),
    password:
      mode === 'firstAccess'
        ? yup
            .string()
            .min(8, 'A senha deve ter no mínimo 8 caracteres')
            .required('Senha é obrigatória')
        : yup.string().notRequired(),
    confirmPassword:
      mode === 'firstAccess'
        ? yup
            .string()
            .required('Confirmação de senha é obrigatória')
            .oneOf([yup.ref('password')], 'As senhas devem coincidir')
        : yup.string().notRequired(),
    observacoes: yup.string().nullable().optional(),
    role:
      mode === 'userCreation' && !isEdition
        ? yup
            .string()
            .required('Cargo é obrigatório')
            .oneOf(
              Object.values(UserRole).filter(
                (role) => role !== UserRole.ELEITOR
              ),
              'Selecione um cargo válido'
            )
        : yup.string().optional().oneOf(Object.values(UserRole)),
    creationMode:
      mode === 'userCreation' && !isEdition
        ? yup
            .string()
            .required('Modo de criação é obrigatório')
            .oneOf(['fromScratch', 'fromVoter'], 'Modo de criação inválido')
        : yup.string().notRequired().oneOf(['fromScratch', 'fromVoter']),
    voterId:
      mode === 'userCreation' && !isEdition
        ? yup
            .string()
            .when('creationMode', ([creationMode], schema) =>
              creationMode === 'fromVoter'
                ? schema.required('Seleção de eleitor é obrigatória')
                : schema.nullable().notRequired()
            )
        : yup.string().notRequired()
  })
}
export type UserRegistrationFormType = yup.InferType<
  ReturnType<typeof getUserRegistrationSchema>
>
