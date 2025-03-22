// src/screens/DashboardSignIn/styles.ts

import styled from 'styled-components'

import { Screen } from '@/utils/styles/commons'
import { color, textColor, backgroundColor } from '@/utils/styles/colors'
import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'
import { StyledButton } from '@/utils/styles/antd'

export const DashboardSignInScreen = styled(Screen)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`

export const SignInFormLogo = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 25px;

  img {
    height: 50px;
  }
`

export const SignInContainer = styled.div<{ active: number }>`
  position: relative;
  width: 100%;
  max-width: ${({ active }) => (active ? '520px' : '400px')};
  padding: 24px;
  border-radius: 8px;

  border: 1px solid ${color('colorBorderSecondary')};
  ${backgroundColor('colorBgBase')};
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.04);
`

export const SignInFormContent = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
  width: 100%;
`

export const SignInFormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  column-gap: 8px;
  width: 100%;
`

export const BackToLoginButton = styled(StyledButton)`
  position: absolute;
  left: 0;
  bottom: 100%;
  display: flex;
  flex-direction: row;
  width: fit-content;
  margin: 0 10px 10px 0;

  ${fontSize('xxs')}
  ${fontHeight('xxs')}
  ${fontWeight('regular')}
`

export const ForgotPasswordLink = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  text-align: center;
  margin-top: 15px;

  a {
    ${fontSize('xxs')}
    ${fontHeight('xxs')}
    ${fontWeight('regular')}
    
    ${textColor('colorPrimary')};
  }
`
