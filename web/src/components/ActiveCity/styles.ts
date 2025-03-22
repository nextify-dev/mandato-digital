import { color } from '@/utils/styles/colors'
// src/components/ActiveCity/styles.ts

import styled from 'styled-components'
import { Tag, theme } from 'antd'

import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'
import { backgroundColor, textColor } from '@/utils/styles/colors'

export const ActiveCity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: fit-content;
  padding: 10px;
  border-radius: 6px;

  background-color: #fffde6;
  border: 2px solid #fec107;
`

export const ActiveCityIndicator = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: fit-content;
`

export const ActiveCityLabel = styled.p`
  width: fit-content;
  margin-top: 1px;

  ${fontSize('xxxs')}
  ${fontHeight('xxxs')}
  ${fontWeight('medium')}

  ${textColor('colorTextLabel')};
`

export const ActiveCityTag = styled(Tag)`
  display: flex;
  width: fit-content;
  margin: 0;
  padding: 4px 6px;

  ${fontSize('xxxs')}
  ${fontHeight('xxxs')}
`

export const ActiveCityAdminWarning = styled.div`
  display: flex;
  align-items: center;
  column-gap: 4px;
  width: 100%;
  border-radius: 6px;
  padding: 4px 6px;

  ${fontSize('xxxs')}
  ${fontHeight('xxxs')}
  ${fontWeight('regular')}

  color: white;

  b {
    ${fontWeight('bold')}
  }

  svg {
    ${fontSize('xs')}
    ${fontHeight('xs')}
  }

  ${backgroundColor('colorPrimary')};
`
