// src/utils/styles/fonts.ts

import { css } from 'styled-components'

interface FontStyle {
  size: string
  height: string
}

interface FontSizes {
  ss: FontStyle
  xxxs: FontStyle
  xxs: FontStyle
  xs: FontStyle
  small: FontStyle
  regular: FontStyle
  large: FontStyle
  xl: FontStyle
  xxl: FontStyle
  xxxl: FontStyle
  sx: FontStyle
}

type FontSizeKeys = keyof FontSizes

// Novo padrão para pesos de fonte
interface FontWeights {
  light: number
  regular: number
  medium: number
  bold: number
  black: number
}

type FontWeightKeys = keyof FontWeights

export const Fonts: FontSizes = {
  ss: {
    size: '0.625rem', // 11px
    height: '0.625rem' // 11px
  },
  xxxs: {
    size: '0.75rem', // 12px
    height: '0.75rem' // 12px
  },
  xxs: {
    size: '0.8125rem', // 13px
    height: '0.8125rem' // 13px
  },
  xs: {
    size: '0.875rem', // 14px
    height: '0.875rem' // 14px
  },
  small: {
    size: '0.9375rem', // 15px
    height: '0.9375rem' // 15px
  },
  regular: {
    size: '1rem', // 16px
    height: '1rem' // 16px
  },
  large: {
    size: '1.125rem', // 18px
    height: '1.125rem' // 18px
  },
  xl: {
    size: '1.25rem', // 20px
    height: '1.25rem' // 20px
  },
  xxl: {
    size: '1.5rem', // 24px
    height: '1.5rem' // 24px
  },
  xxxl: {
    size: '2rem', // 32px
    height: '2rem' // 32px
  },
  sx: {
    size: '2.625rem', // 42px
    height: '2.625rem' // 42px
  }
} as const

// Novo objeto para os pesos de fonte
export const Weights: FontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 600,
  black: 900
} as const

// Função para definir apenas o font-size
export const fontSize = (size: FontSizeKeys) => css`
  font-size: ${Fonts[size]?.size} !important;
`

// Função para definir apenas o line-height
export const fontHeight = (size: FontSizeKeys) => css`
  line-height: ${Fonts[size]?.height} !important;
`

// Função para definir apenas o font-weight
export const fontWeight = (weight: FontWeightKeys) => css`
  font-weight: ${Weights[weight]} !important;
`
