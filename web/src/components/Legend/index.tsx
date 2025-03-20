// src/components/Legend/index.tsx

import { useState } from 'react'
import { UserRole } from '@/@types/user'
import * as S from './styles'

const Legend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  const legendItems = [
    {
      role: UserRole.ADMINISTRADOR_GERAL,
      color: '#FF0000',
      label: 'Administrador'
    },
    { role: UserRole.PREFEITO, color: '#800080', label: 'Prefeito' },
    { role: UserRole.VEREADOR, color: '#FFFF00', label: 'Vereador' },
    {
      role: UserRole.CABO_ELEITORAL,
      color: '#FFA500',
      label: 'Cabo Eleitoral'
    },
    { role: UserRole.ELEITOR, color: '#0000FF', label: 'Eleitor' }
  ]

  return (
    <S.LegendWrapper>
      <S.LegendButton onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Ocultar Legenda' : 'Mostrar Legenda'}
      </S.LegendButton>
      {isOpen && (
        <S.LegendContent>
          {legendItems.map((item) => (
            <S.LegendItem key={item.role}>
              <S.ColorBox style={{ backgroundColor: item.color }} />
              {item.label}
            </S.LegendItem>
          ))}
        </S.LegendContent>
      )}
    </S.LegendWrapper>
  )
}

export default Legend
