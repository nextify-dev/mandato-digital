// src/screens/ForgotPassword/styles.ts

import styled from 'styled-components'

import { Screen } from '@/utils/styles/commons'
import { color } from '@/utils/styles/colors'

export const ForgotPasswordScreen = styled(Screen)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`

export const ForgotPasswordContainer = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid ${color('colorBorderSecondary')};
  background-color: ${color('colorBgBase')};
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.04);
`
