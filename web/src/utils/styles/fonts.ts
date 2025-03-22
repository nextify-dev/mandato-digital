// src/utils/styles/fonts.ts

import { css } from 'styled-components'

interface FontStyle {
  size: string
  height: string
  weight: number
}

interface FontSizes {
  xxxs: FontStyle
  xxs: FontStyle
  xs: FontStyle
  small: FontStyle
  regular: FontStyle
  large: FontStyle
  xl: FontStyle
  xxl: FontStyle
  xxxl: FontStyle
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
  xxxs: {
    size: '0.625rem', // 10px
    height: '0.625rem', // 10px
    weight: 400 // Regular
  },
  xxs: {
    size: '0.75rem', // 12px
    height: '0.75rem', // 12px
    weight: 400 // Regular
  },
  xs: {
    size: '0.875rem', // 14px
    height: '0.875rem', // 14px
    weight: 400 // Regular
  },
  small: {
    size: '0.938rem', // 15px
    height: '0.938rem', // 15px
    weight: 500 // Medium
  },
  regular: {
    size: '1rem', // 16px
    height: '1rem', // 16px
    weight: 400 // Regular
  },
  large: {
    size: '1.25rem', // 20px
    height: '1.25rem', // 20px
    weight: 500 // Medium
  },
  xl: {
    size: '1.625rem', // 26px
    height: '1.625rem', // 26px
    weight: 600 // Semi-bold
  },
  xxl: {
    size: '2rem', // 32px
    height: '2rem', // 32px
    weight: 600 // Semi-bold
  },
  xxxl: {
    size: '2.875rem', // 46px
    height: '2.875rem', // 46px
    weight: 700 // Bold
  }
} as const

// Novo objeto para os pesos de fonte
export const Weights: FontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900
} as const

// Função para definir apenas o font-size
export const fontSize = (size: FontSizeKeys) => css`
  font-size: ${Fonts[size]?.size} !important;
`

// Função para definir apenas o line-height
export const fontHeight = (size: FontSizeKeys) => css`
  line-height: ${Fonts[size]?.height};
`

// Função para definir apenas o font-weight
export const fontWeight = (weight: FontWeightKeys) => css`
  font-weight: ${Weights[weight]};
`
