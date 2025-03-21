// src/components/SideCard/index.tsx

import { Button } from 'antd'
import { SideCardData } from '@/@types/map'
import { UserRole } from '@/@types/user'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '../DynamicDescriptions'
import * as S from './styles'
import { LuX } from 'react-icons/lu'

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
  const { user, recentDemands, recentVisits, electoralBase, linkedVoters } =
    data

  // Definir os campos para o DynamicDescriptions
  const fields: DynamicDescriptionsField<SideCardData>[] = [
    {
      key: 'user',
      label: 'Nome Completo',
      render: () => user.profile?.nomeCompleto || 'N/A'
    },
    {
      key: 'user',
      label: 'Endereço',
      render: () =>
        `${user.profile?.endereco || 'N/A'}, ${user.profile?.numero || 'N/A'}`
    },
    {
      key: 'user',
      label: 'Telefone',
      render: () => user.profile?.telefone || 'N/A'
    },
    {
      key: 'user',
      label: 'WhatsApp',
      render: () => user.profile?.whatsapp || 'N/A'
    },
    {
      key: 'user',
      label: 'Data de Cadastro',
      render: () => new Date(user.createdAt).toLocaleDateString()
    },
    {
      key: 'recentDemands',
      label: 'Demandas Recentes',
      render: () => recentDemands?.toString() || '0'
    },
    {
      key: 'recentVisits',
      label: 'Visitas Recentes',
      render: () => recentVisits?.length.toString() || '0'
    }
  ]

  // Adicionar campos condicionais com base no tipo de usuário
  if (user.role === UserRole.VEREADOR && electoralBase !== undefined) {
    fields.push({
      key: 'electoralBase',
      label: 'Base Eleitoral',
      render: () => electoralBase.toString()
    })
  }

  if (user.role === UserRole.CABO_ELEITORAL && linkedVoters !== undefined) {
    fields.push({
      key: 'linkedVoters',
      label: 'Eleitores Vinculados',
      render: () => linkedVoters.toString()
    })
  }

  return (
    <S.SideCardWrapper>
      <S.SideCardHeader>
        <h2>Informações do Usuário</h2>
        <Button icon={<LuX />} onClick={onClose} size="small" />
      </S.SideCardHeader>
      <DynamicDescriptions data={data} fields={fields} />
      {/* <Button type="link" onClick={onViewHistory}>
        Ver Histórico Completo
      </Button> */}
    </S.SideCardWrapper>
  )
}

export default SideCard
