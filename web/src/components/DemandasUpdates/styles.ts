// src/components/DemandasUpdates/styles.ts

import { font } from '@/utils/styles/fonts'
import styled from 'styled-components'

export const DemandasUpdates = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 14px;
`

export const DemandasUpdatesDetails = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 6px;

  span {
    ${font('xxs')}

    b {
      font-weight: 500;
    }
  }
`

export const DemandasUpdatesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 6px;
`

export const DemandasUpdatesContent = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 6px;

  span {
    ${font('xxs')}

    b {
      font-weight: 500;
    }
  }
`
