// src/components/SideCard/index.tsx

import { Button } from 'antd'
import { SideCardData } from '@/@types/map'
import * as S from './styles'

interface SideCardProps {
  data: SideCardData
  onClose: () => void
  onViewHistory: () => void
}

const SideCard: React.FC<SideCardProps> = ({
  data,
  onClose,
  onViewHistory
}) => {
  const { user } = data

  return (
    <S.SideCardWrapper>
      <S.CloseButton onClick={onClose}>X</S.CloseButton>
      <h3>{user.profile?.nomeCompleto}</h3>
      <p>
        <strong>Endereço:</strong> {user.profile?.endereco},{' '}
        {user.profile?.numero}
      </p>
      <p>
        <strong>Telefone:</strong> {user.profile?.telefone || 'N/A'}
      </p>
      <p>
        <strong>WhatsApp:</strong> {user.profile?.whatsapp}
      </p>
      <p>
        <strong>Data de Cadastro:</strong>{' '}
        {new Date(user.createdAt).toLocaleDateString()}
      </p>
      <p>
        <strong>Demandas Recentes:</strong> {data.recentDemands}
      </p>
      <p>
        <strong>Visitas Recentes:</strong> {data.recentVisits.length}
      </p>
      <Button type="link" onClick={onViewHistory}>
        Ver Histórico Completo
      </Button>
    </S.SideCardWrapper>
  )
}

export default SideCard
