// src/screens/DashboardV1/views/MapaEleitoral/styles.ts

import { font } from '@/utils/styles/fonts'
import styled from 'styled-components'

export const LegendWrapper = styled.div`
  z-index: 1000;
  position: absolute;
  bottom: 30px;
  left: 10px;
  display: flex;
  flex-direction: column;
  row-gap: 6px;
`

export const LegendContent = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  padding: 18px 14px;
  border-radius: 6px;

  background: #fff;
  border: 1px solid #d9d9d9;
`

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${font('xxs')}
`

export const ColorBox = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
`
