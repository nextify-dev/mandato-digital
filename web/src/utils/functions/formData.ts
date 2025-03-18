// src/utils/functions/formData.ts
import { User, UserRegistrationFormType } from '@/@types/user'
import { applyMask } from '@/utils/functions/masks'

export const getInitialFormData = (
  user?: User | Partial<UserRegistrationFormType>,
  applyMasks: boolean = true
): Partial<UserRegistrationFormType> => {
  // Type guard para verificar se user é do tipo User
  const isUserType = (u: any): u is User => !!u && 'profile' in u

  // profile contém os dados pessoais, seja de User.profile ou diretamente do Partial<UserRegistrationFormType>
  const profile = isUserType(user) ? user.profile || {} : user || {}

  // baseData contém os dados de nível superior (email, cityId, role), apenas se for User
  const baseData = isUserType(user) ? user : ({} as Partial<User>)

  const formatDate = (date?: string): string => {
    if (!date) return ''
    // Se a data estiver em formato ISO, converte para DD/MM/AAAA
    if (date.includes('-')) {
      const [year, month, day] = date.split('T')[0].split('-')
      return `${day}/${month}/${year}`
    }
    return date // Já está em DD/MM/AAAA
  }

  return {
    email:
      'email' in baseData ? baseData.email || '' : (profile as any).email || '',
    nomeCompleto: profile.nomeCompleto || '',
    cpf:
      applyMasks && profile.cpf
        ? applyMask(profile.cpf, 'cpf')
        : profile.cpf || '',
    dataNascimento:
      applyMasks && profile.dataNascimento
        ? applyMask(formatDate(profile.dataNascimento), 'birthDate')
        : formatDate(profile.dataNascimento) || '',
    genero: profile.genero || undefined,
    religiao: profile.religiao || undefined,
    foto: profile.foto || null,
    telefone:
      applyMasks && profile.telefone
        ? applyMask(profile.telefone, 'phone')
        : profile.telefone || null,
    whatsapp:
      applyMasks && profile.whatsapp
        ? applyMask(profile.whatsapp, 'phone')
        : profile.whatsapp || '',
    instagram: profile.instagram || null,
    facebook: profile.facebook || null,
    cep:
      applyMasks && profile.cep
        ? applyMask(profile.cep, 'cep')
        : profile.cep || '',
    endereco: profile.endereco || '',
    numero: profile.numero || '',
    complemento: profile.complemento || null,
    bairro: profile.bairro || '',
    cidade: profile.cidade || '',
    estado: profile.estado || '',
    cityId: 'cityId' in baseData ? baseData.cityId || undefined : undefined,
    role: 'role' in baseData ? baseData.role || undefined : undefined,
    creationMode: undefined,
    voterId: undefined,
    password: undefined,
    confirmPassword: undefined,
    observacoes: undefined
  }
}
