// src/components/UserMenu/styles.ts

import { textColor } from '@/utils/styles/colors'
import { fontSize, fontWeight, fontHeight } from '@/utils/styles/fonts'
import { Tag } from 'antd'
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
  row-gap: 3px;
  margin-right: 8px;
`

export const UserMenuLoading = styled.p`
  ${fontSize('xs')}
  ${fontHeight('xs')}

  ${textColor('colorTextHeading')}
`

export const UserWelcome = styled.p`
  ${fontSize('xxs')}
  ${fontHeight('xxs')}
  ${fontWeight('light')}

  b {
    ${fontWeight('medium')}
  }

  ${textColor('colorTextHeading')}
`

export const UserRoleTag = styled(Tag)`
  display: flex;
  margin: 0;
  padding: 3px 6px;
  cursor: pointer;

  ${fontSize('xxxs')}
  ${fontHeight('xxxs')}
`
