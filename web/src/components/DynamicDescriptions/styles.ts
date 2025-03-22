// src/components/DynamicDescriptions/styles.ts

import styled from 'styled-components'
import { Tag, theme } from 'antd'

import { textColor } from '@/utils/styles/colors'
import { StyledButton } from '@/utils/styles/antd'
import { fontSize } from '@/utils/styles/fonts'

export const DescriptionContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
`

export const CopyButton = styled(StyledButton)`
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px !important;
  height: 20px !important;
  margin-top: 1px;

  svg {
    transition: 0.25s;
    ${fontSize('xxxs')}
    ${textColor('colorTextLabel')}
  }

  &:hover {
    color: #af6dac;

    svg {
      ${textColor('colorPrimary')}
    }
  }
`
