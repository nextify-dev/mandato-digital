// src/screens/DashboardV1/views/MapaEleitoral/styles.ts

import { textColor } from '@/utils/styles/colors'
import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'
import styled from 'styled-components'

export const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  ${fontSize('small')}
  ${fontHeight('small')}
  ${fontWeight('regular')}


  ${textColor('colorError')}
`
