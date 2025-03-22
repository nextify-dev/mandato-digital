// src/components/DemandasUpdates/styles.ts

import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'
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
    ${fontSize('xxs')}
    ${fontHeight('xxs')}


    b {
      ${fontWeight('medium')}
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
    ${fontSize('xxs')}
    ${fontHeight('xxs')}
    

    b {
      ${fontWeight('medium')}
    }
  }
`
