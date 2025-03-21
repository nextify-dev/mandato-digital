// src/screens/DashboardV1/views/MapaEleitoral/styles.ts

import { textColor } from '@/utils/styles/colors'
import { font } from '@/utils/styles/fonts'
import styled from 'styled-components'

export const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  ${font('small')}
  ${textColor('colorError')}
  font-weight: 400;
`
