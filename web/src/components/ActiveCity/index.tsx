// src/components/ActiveCity.tsx

import * as S from './styles'

interface IActiveCityProps {
  cityId?: string
}

const ActiveCity = ({ cityId }: IActiveCityProps) => {
  return (
    <S.ActiveCity>
      <S.ActiveCityLabel>Minha Cidade:</S.ActiveCityLabel>
      <S.ActiveCityTag color="#fec107">Porto Alegre - RS</S.ActiveCityTag>
    </S.ActiveCity>
  )
}

export default ActiveCity
