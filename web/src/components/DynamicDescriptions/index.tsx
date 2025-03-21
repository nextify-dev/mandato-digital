// src/components/DynamicDescriptions/index.tsx

import * as S from './styles'

import React, { useState } from 'react'
import { DescriptionsProps, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { StyledDescriptions } from '@/utils/styles/antd'

// Estilos personalizados

export interface DynamicDescriptionsField<T> {
  key: keyof T | string
  label: string
  render?: (value: any) => React.ReactNode
}

export interface DynamicDescriptionsProps<T> extends DescriptionsProps {
  data: Partial<T>
  fields: DynamicDescriptionsField<T>[]
}

const DynamicDescriptions = <T,>({
  data,
  fields,
  ...rest
}: DynamicDescriptionsProps<T>) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const handleCopy = (value: any) => {
    const textToCopy = value?.toString() || '-'
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        message.success('Valor copiado!')
      })
      .catch(() => {
        message.error('Falha ao copiar o valor.')
      })
  }

  return (
    <StyledDescriptions bordered column={1} {...rest}>
      {fields.map(({ key, label, render }) => {
        const value = data[key as keyof T]
        const displayValue = render ? render(value) : value ?? '-'

        return (
          <StyledDescriptions.Item key={key as string} label={label}>
            <S.DescriptionContent
              onMouseEnter={() => value && setHoveredKey(key as string)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              {React.isValidElement(displayValue)
                ? displayValue
                : String(displayValue)}
              {hoveredKey === key &&
                value &&
                !React.isValidElement(displayValue) && (
                  <S.CopyButton
                    icon={<CopyOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(value)
                    }}
                    size="small"
                  />
                )}
            </S.DescriptionContent>
          </StyledDescriptions.Item>
        )
      })}
    </StyledDescriptions>
  )
}

export default DynamicDescriptions
