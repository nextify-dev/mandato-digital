import * as S from './styles'

import { Button } from 'antd'

import { useAuth } from '@/contexts/AuthProvider'

interface IDashboardV1Screen {}

const DashboardV1Screen = ({}: IDashboardV1Screen) => {
  const { logout } = useAuth()

  return (
    <S.DashboardV1Screen>
      <Button onClick={logout}>Sair</Button>
    </S.DashboardV1Screen>
  )
}

export default DashboardV1Screen
