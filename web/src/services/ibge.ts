// src/services/ibge.ts
export interface IBGEState {
  id: number
  sigla: string
  nome: string
}

export interface IBGECity {
  id: number
  nome: string
}

export interface CityDetails {
  cepRangeStart: string
  cepRangeEnd: string
}

export const ibgeService = {
  getStates: async (): Promise<IBGEState[]> => {
    const response = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
      { mode: 'cors' }
    )
    if (!response.ok) throw new Error('Erro ao buscar estados')
    const data = await response.json()
    return data.sort((a: IBGEState, b: IBGEState) =>
      a.nome.localeCompare(b.nome)
    )
  },

  getCitiesByState: async (stateSigla: string): Promise<IBGECity[]> => {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateSigla}/municipios`,
      { mode: 'cors' }
    )
    if (!response.ok) throw new Error('Erro ao buscar cidades')
    const data = await response.json()
    return data.sort((a: IBGECity, b: IBGECity) => a.nome.localeCompare(b.nome))
  },

  getCityDetails: async (
    cityName: string,
    stateSigla: string
  ): Promise<CityDetails> => {
    try {
      const brasilApiUrl = `https://brasilapi.com.br/api/cep/v2/${stateSigla.toLowerCase()}/${encodeURIComponent(
        cityName
      )}`
      let cepRangeStart = '00000-000'
      let cepRangeEnd = '99999-999'

      const cepResponse = await fetch(brasilApiUrl, { mode: 'cors' })
      if (cepResponse.ok) {
        const cepData = await cepResponse.json()
        const baseCep = cepData.cep.replace('-', '')
        cepRangeStart = `${baseCep.slice(0, 5)}-000`
        cepRangeEnd = `${baseCep.slice(0, 5)}-999`
      } else {
        console.warn('BrasilAPI retornou erro, usando CEPs padrão')
      }

      return {
        cepRangeStart,
        cepRangeEnd
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da cidade:', error)
      return {
        cepRangeStart: `${stateSigla === 'SP' ? '01000' : '59000'}-000`,
        cepRangeEnd: `${stateSigla === 'SP' ? '19999' : '59999'}-999`
      }
    }
  }
}
