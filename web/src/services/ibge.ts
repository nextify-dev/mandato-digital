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
  }
}
