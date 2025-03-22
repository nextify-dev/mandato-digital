// src/screens/DashboardV1/views/SegmentacaoEleitores/styles.ts

import styled from 'styled-components'

export const SegmentacaoEleitoresView = styled.div`
  display: flex;
  gap: 20px;
`

export const FiltersPanel = styled.div`
  width: 300px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
`

export const MainContent = styled.div`
  flex: 1;
`

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`

export const HeaderTitle = styled.h2`
  margin: 0;
`

export const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`

export const SubmenuWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
`

export const ChartsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`

export const VotersList = styled.div`
  margin-top: 20px;
`
