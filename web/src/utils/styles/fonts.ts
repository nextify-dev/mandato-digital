// src/utils/styles/fonts.ts

import { css } from 'styled-components'

interface FontStyle {
  size: string
  height: string
  weight: number
}

interface FontVariants {
  paragraph: FontStyle
  title: FontStyle
  subtitle: FontStyle
  legend: FontStyle
  button: FontStyle
  input: FontStyle
  label: FontStyle
  caption: FontStyle
}

type FontVariantKeys = keyof FontVariants

export const Fonts: FontVariants = {
  paragraph: {
    size: '1rem', // 16px
    height: '1.5rem', // 24px
    weight: 400 // Regular
  },
  title: {
    size: '2.875rem', // 46px
    height: '2.875rem', // 46px
    weight: 700 // Bold
  },
  subtitle: {
    size: '1.625rem', // 26px
    height: '1.625rem', // 26px
    weight: 600 // Semi-bold
  },
  legend: {
    size: '0.875rem', // 14px
    height: '1.25rem', // 20px
    weight: 400 // Regular
  },
  button: {
    size: '1rem', // 16px
    height: '1.5rem', // 24px
    weight: 500 // Medium
  },
  input: {
    size: '0.938rem', // 15px
    height: '0.938rem', // 15px
    weight: 500 // Medium
  },
  label: {
    size: '0.938rem', // 15px
    height: '0.938rem', // 22px
    weight: 500 // Medium
  },
  caption: {
    size: '0.75rem', // 12px
    height: '1rem', // 16px
    weight: 400 // Regular
  }
} as const

export const font = (variant: FontVariantKeys) => css`
  font-size: ${Fonts[variant]?.size} !important;
  line-height: ${Fonts[variant]?.height} !important;
  font-weight: ${Fonts[variant]?.weight} !important;
`
