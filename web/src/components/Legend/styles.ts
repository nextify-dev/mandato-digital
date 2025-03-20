// src/screens/DashboardV1/views/MapaEleitoral/styles.ts

import styled from 'styled-components'

export const LegendWrapper = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
`

export const LegendButton = styled.button`
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
`

export const LegendContent = styled.div`
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 10px;
  border-radius: 4px;
  margin-top: 5px;
`

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
`

export const ColorBox = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`
