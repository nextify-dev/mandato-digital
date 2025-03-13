// src/components/ActiveCity/styles.ts

import styled from 'styled-components'
import { Tag, theme } from 'antd'

import { font } from '@/utils/styles/fonts'
import { textColor } from '@/utils/styles/colors'

export const ActiveCity = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: fit-content;
  padding: 10px;
  border-radius: 6px;

  background-color: #fffde6;
  border: 2px solid #fec107;
`

export const ActiveCityLabel = styled.p`
  width: fit-content;
  margin-top: 1px;

  ${font('xxxs')}
  font-weight: 500;

  ${textColor('colorTextLabel')};
`

export const ActiveCityTag = styled(Tag)`
  display: flex;
  width: fit-content;
  margin: 0;
  padding: 4px 6px;

  ${font('xxxs')}
`
