// src/components/ActiveCity.tsx

import { useCities } from '@/contexts/CitiesProvider'
import * as S from './styles'
import { IoIosAlert } from 'react-icons/io'

interface IActiveCityProps {
  cityId?: string
  menuClosed: boolean
}

const ActiveCity = ({ cityId, menuClosed }: IActiveCityProps) => {
  const { getCityById } = useCities()

  return (
    <S.ActiveCity>
      <S.ActiveCityIndicator>
        {!menuClosed && <S.ActiveCityLabel>Minha Cidade:</S.ActiveCityLabel>}
        <S.ActiveCityTag color="#fec107">
          {!menuClosed && `${getCityById(cityId)?.name}, `}
          {getCityById(cityId)?.state.toUpperCase()}
        </S.ActiveCityTag>
      </S.ActiveCityIndicator>
      {!menuClosed && (
        <S.ActiveCityAdminWarning>
          <IoIosAlert />
          <b>Atenção:</b>
          Você é um Adm. Geral
        </S.ActiveCityAdminWarning>
      )}
    </S.ActiveCity>
  )
}

export default ActiveCity
