// src/utils/styles/colors.ts

import { css } from 'styled-components'
import { theme } from 'antd'

type ColorTokenKeys =
  | 'colorPrimary'
  | 'colorText'
  | 'colorTextDescription'
  | 'colorTextLabel'
  | 'colorBgBase'
  | 'colorBorder'
  | 'colorError'
  | 'colorSuccess'
  | 'colorWarning'
  | 'colorInfo'
  | 'colorBorderSecondary'
  | 'colorBgElevated'
  | 'colorTextBase'

const { useToken } = theme

export const color = (colorKey: ColorTokenKeys) => css`
  color: ${() => useToken().token[colorKey]};
`

export const backgroundColor = (colorKey: ColorTokenKeys) => css`
  background-color: ${() => useToken().token[colorKey]};
`

export { useToken }
