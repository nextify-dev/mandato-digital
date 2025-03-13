// src/utils/functions/masks.ts

import dayjs from 'dayjs'

// Máscaras para campos de texto
const maskFunctions = {
  phone: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  },
  cpf: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  },
  cnpj: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  },
  cep: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  },
  birthDate: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1')
  },
  ageFromISO: (isoDate: string) => {
    const date = dayjs(isoDate)
    if (!date.isValid()) {
      console.error('Data ISO inválida:', isoDate)
      return 'N/A'
    }
    const age = dayjs().diff(date, 'year')
    return `${age} anos`
  },
  // Formatação de nome de usuário
  username: (value: string) => {
    const nameParts = value.split(' ')

    if (nameParts.length < 2) {
      return nameParts[0].charAt(0).toUpperCase()
    } else {
      const firstName = nameParts[0].charAt(0)
      const lastName = nameParts[nameParts.length - 1].charAt(0)
      return `${firstName.toUpperCase()}${lastName.toUpperCase()}`
    }
  },
  // Formatação de moeda
  currency: (value: number | string) => {
    const numericValue =
      typeof value === 'string'
        ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
        : value
    if (isNaN(numericValue)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue)
  },
  // Formatações de data ISO
  dateTime: (isoDate: string) => {
    const date = new Date(isoDate)
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const year = String(date.getUTCFullYear()).slice(-2)
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} às ${hours}:${minutes}`
  },
  time: (isoDate: string) => {
    const date = new Date(isoDate)
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  },
  fullDate: (isoDate: string) => {
    const monthNames = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro'
    ]
    const date = new Date(isoDate)
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = monthNames[date.getUTCMonth()]
    const year = String(date.getUTCFullYear())
    return `${day} de ${month} de ${year}`
  }
}

// Tipagem para as chaves das máscaras
export type MaskType = keyof typeof maskFunctions

// Função principal para aplicar máscaras
export const applyMask = (
  value: string | number,
  maskType: MaskType
): string => {
  if (typeof value === 'number' && maskType !== 'currency') {
    throw new Error('Value must be a string for this mask type')
  }
  return maskFunctions[maskType](value as any)
}

// Remove todos os caracteres não numéricos
export const removeMask = (value: string): string => {
  return value.replace(/\D/g, '')
}

// Sanitiza email para gerar chaves válidas
export const sanitizeEmail = (email: string): string => {
  return email.replace(/[.#$[\]]/g, '_').toLowerCase()
}

// Converte data no formato DD/MM/AAAA para ISO
export const convertToISODate = (date: string): string => {
  const [day, month, year] = date.split('/').map(Number)
  return `${year}-${month?.toString().padStart(2, '0')}-${day
    ?.toString()
    .padStart(2, '0')}`
}

// Exporta o objeto de máscaras para uso direto, se necessário
export const masks = maskFunctions
