// src/components/UserMenu/styles.ts

import styled from 'styled-components'
import { Tag, theme } from 'antd'

import { font } from '@/utils/styles/fonts'

export const ActiveCity = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: fit-content;
  padding: 10px;
  border-radius: 8px;

  background-color: rgba(0, 0, 0, 0.05);
`

export const ActiveCityLabel = styled.p`
  width: fit-content;

  ${font('xxxs')}
  font-weight: 500;
`

export const ActiveCityTag = styled(Tag)`
  display: flex;
  width: fit-content;
  margin: 0;
  padding: 4px 6px;

  ${font('xxxs')}
`
