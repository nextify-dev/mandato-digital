// src/screens/DashboardV1/views/MapaEleitoral/styles.ts

import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'
import { Button } from 'antd'
import styled from 'styled-components'

export const SideCardWrapper = styled.div`
  z-index: 1000;
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  row-gap: 14px;
  width: 400px;
  padding: 16px;
  border-radius: 6px;

  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`

export const SideCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  h2 {
    ${fontSize('small')}
    ${fontHeight('small')}
    ${fontWeight('bold')}
  }
`
