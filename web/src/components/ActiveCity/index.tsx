// src/components/ActiveCity.tsx

import * as S from './styles'
import { IoIosAlert } from 'react-icons/io'

interface IActiveCityProps {
  cityId?: string
}

const ActiveCity = ({ cityId }: IActiveCityProps) => {
  return (
    <S.ActiveCity>
      <S.ActiveCityIndicator>
        <S.ActiveCityLabel>Minha Cidade:</S.ActiveCityLabel>
        <S.ActiveCityTag color="#fec107">Porto Alegre - RS</S.ActiveCityTag>
      </S.ActiveCityIndicator>
      <S.ActiveCityAdminWarning>
        <IoIosAlert />
        <b>Atenção:</b>
        Você é um Adm. Geral
      </S.ActiveCityAdminWarning>
    </S.ActiveCity>
  )
}

export default ActiveCity
