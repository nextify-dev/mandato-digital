// src/components/UserMenu/styles.ts

import { textColor } from '@/utils/styles/colors'
import { font } from '@/utils/styles/fonts'
import styled from 'styled-components'

export const UserMenu = styled.div`
  display: flex;
  cursor: pointer;
`

export const UserMenuInfos = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  row-gap: 5px;
  margin-right: 10px;
`

export const UserWelcome = styled.p`
  font-weight: 300;

  b {
    font-weight: 500;
  }

  ${font('xs')}
  ${textColor('colorTextHeading')}
`
