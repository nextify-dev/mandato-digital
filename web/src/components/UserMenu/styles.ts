// src/components/UserMenu/styles.ts

import { textColor } from '@/utils/styles/colors'
import { font } from '@/utils/styles/fonts'
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
  ${font('xs')}
  ${textColor('colorTextHeading')}
`

export const UserWelcome = styled.p`
  font-weight: 300;

  b {
    font-weight: 500;
  }

  ${font('xxs')}
  ${textColor('colorTextHeading')}
`

export const UserRoleTag = styled(Tag)`
  display: flex;
  margin: 0;
  padding: 2px 5px;
  cursor: pointer;

  ${font('xxxs')}
`
