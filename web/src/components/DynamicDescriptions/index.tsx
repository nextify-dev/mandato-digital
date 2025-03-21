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

// Função auxiliar para verificar se o valor é "copiável"
const isCopyableValue = (value?: any): boolean => {
  if (value === undefined || value === null) {
    return false
  }

  if (typeof value === 'object' || value.includes('[object Object]')) {
    return false
  }

  return typeof value === 'string' || typeof value === 'number'
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

        // Verificar se o valor é copiável
        const canCopy = isCopyableValue(displayValue)

        // Função para renderizar o valor
        const renderDisplayValue = () => {
          // Se for um ReactNode válido (como um elemento JSX), renderize diretamente
          if (React.isValidElement(displayValue)) {
            return displayValue
          }

          // Se for um array, renderize cada item
          if (Array.isArray(displayValue)) {
            return displayValue.map((item, index) => (
              <div key={index}>
                {React.isValidElement(item) ? item : String(item)}
              </div>
            ))
          }

          // Caso contrário, renderize como string
          return String(displayValue)
        }

        return (
          <StyledDescriptions.Item key={key as string} label={label}>
            <S.DescriptionContent
              onMouseEnter={() => canCopy && setHoveredKey(key as string)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              {renderDisplayValue()}
              {hoveredKey === key &&
                canCopy &&
                !React.isValidElement(displayValue) &&
                !Array.isArray(displayValue) && (
                  <S.CopyButton
                    icon={<CopyOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(displayValue)
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
