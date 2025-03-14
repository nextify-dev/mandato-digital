// src/components/DynamicDescriptions/styles.ts

import styled from 'styled-components'
import { Tag, theme } from 'antd'

import { font } from '@/utils/styles/fonts'
import { textColor } from '@/utils/styles/colors'
import { StyledButton } from '@/utils/styles/antd'

export const DescriptionContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
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
    font-size: 12px;
    ${textColor('colorTextLabel')}
  }

  &:hover {
    color: #af6dac;

    svg {
      ${textColor('colorPrimary')}
    }
  }
`
