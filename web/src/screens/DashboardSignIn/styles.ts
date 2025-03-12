// src/screens/DashboardSignIn/styles.ts

import styled from 'styled-components'

import { Screen } from '@/utils/styles/commons'
import { color } from '@/utils/styles/colors'

export const DashboardSignInScreen = styled(Screen)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`

export const SignInContainer = styled.div<{ active: number }>`
  width: 100%;
  max-width: ${({ active }) => (active ? '520px' : '400px')};
  padding: 24px;
  border-radius: 8px;
  border: 1px solid ${color('colorBorderSecondary')};
  background-color: ${color('colorBgBase')};
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.04);
`

export const ForgotPasswordLink = styled.div`
  text-align: center;
  margin-top: 16px;
  a {
    font-size: 0.875rem;
    color: ${color('colorPrimary')};
  }
`
