// src/components/DemandasUpdates/index.tsx

import React from 'react'
import moment from 'moment'
import { DemandUpdate } from '@/@types/demand'
import { getDemandStatusData } from '@/@types/demand'
import { useUsers } from '@/contexts/UsersProvider'
import * as S from './styles'
import { StyledCollapse } from '@/utils/styles/antd'
import { getRoleData } from '@/@types/user'

interface DemandasUpdatesProps {
  description: string
  updates: DemandUpdate[] | null | undefined
}

const DemandasUpdates: React.FC<DemandasUpdatesProps> = ({
  description,
  updates
}) => {
  const { allUsers, getUserById } = useUsers()

  const renderUpdates = (updates: DemandUpdate[] | null | undefined) => {
    if (!updates || updates.length === 0) {
      return 'Nenhuma atualização registrada.'
    }

    // Mapeia as atualizações para o formato de items do Collapse
    const items = updates.map((update, index) => ({
      key: index.toString(),
      label: `Atualização ${index + 1} - ${moment(update.updatedAt).format(
        'DD/MM/YYYY HH:mm'
      )}`,
      children: (
        <S.DemandasUpdatesContent>
          <span>
            <b>Atualizado por: </b>
            {getUserById(update.updatedBy)?.profile?.nomeCompleto}
            {' - '}
            {getRoleData(getUserById(update.updatedBy)?.role).label}
          </span>
          <span>
            <b>Novo Status:</b> {getDemandStatusData(update.newStatus).label}
          </span>
        </S.DemandasUpdatesContent>
      )
    }))

    return <StyledCollapse items={items} />
  }

  return (
    <S.DemandasUpdates>
      <S.DemandasUpdatesDetails>
        <span>
          <b>Descrição:</b> {description}
        </span>
        <span>
          <b>Histórico de Atualizações:</b>
        </span>
      </S.DemandasUpdatesDetails>
      <S.DemandasUpdatesWrapper>
        {renderUpdates(updates)}
      </S.DemandasUpdatesWrapper>
    </S.DemandasUpdates>
  )
}

export default DemandasUpdates
