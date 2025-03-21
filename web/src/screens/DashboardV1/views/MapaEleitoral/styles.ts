// src/screens/DashboardV1/views/MapaEleitoral/styles.ts

import styled from 'styled-components'

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
`

export const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`

export const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  border-radius: 8px;
  overflow: hidden;
`
