// src/utils/functions/geolocation.ts

import { createAxiosInstance } from '@/lib/axios'

const viaCepApi = createAxiosInstance('https://viacep.com.br/ws/')

export const fetchAddressByCep = async (cep: string): Promise<any> => {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) throw new Error('CEP inválido')

  try {
    const response = await viaCepApi.get(`${cleanCep}/json/`)
    const data = response.data

    if (data.erro) throw new Error('CEP não encontrado')
    return data
  } catch (error) {
    throw error instanceof Error ? error : new Error('Erro ao buscar CEP')
  }
}
