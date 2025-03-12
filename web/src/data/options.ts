// ============================================== GENDER OPTIONS

export const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefiro não informar', value: 'nao_informado' }
]

export const getGenderLabel = (value: string) =>
  GENDER_OPTIONS.find((opt) => opt.value === value)?.label || value

// ============================================== RELIGION OPTIONS

export const RELIGION_OPTIONS = [
  { label: 'Católico', value: 'catolico' },
  { label: 'Evangélico', value: 'evangelico' },
  { label: 'Espírita', value: 'espirita' },
  { label: 'Budista', value: 'budista' },
  { label: 'Islâmico', value: 'islamico' },
  { label: 'Judaico', value: 'judaico' },
  { label: 'Umbanda', value: 'umbanda' },
  { label: 'Candomblé', value: 'candomble' },
  { label: 'Ateu', value: 'ateu' },
  { label: 'Agnóstico', value: 'agnostico' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefiro não informar', value: 'nao_informado' }
]

export const getReligionLabel = (value: string | null) =>
  value
    ? RELIGION_OPTIONS.find((opt) => opt.value === value)?.label || value
    : 'Não informado'
