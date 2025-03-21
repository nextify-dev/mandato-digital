// src/utils/functions/geolocation.ts

import { createAxiosInstance } from '@/lib/axios'
import axios from 'axios'

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

export interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
  status: string
}

export const geocodeAddress = async (
  address: string,
  apiKey: string
): Promise<{ latitude: number; longitude: number }> => {
  try {
    const response = await axios.get<GeocodeResponse>(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: apiKey
        }
      }
    )

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      throw new Error('Geocoding failed: ' + response.data.status)
    }

    const { lat, lng } = response.data.results[0].geometry.location
    return { latitude: lat, longitude: lng }
  } catch (error) {
    console.error('Error geocoding address:', address, error)
    return { latitude: 0, longitude: 0 } // Fallback para coordenadas padrão
  }
}
