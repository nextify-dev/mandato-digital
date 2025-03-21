// src/components/FiltersPanel/index.tsx

import * as S from './styles'
import { Select } from 'antd'
import { MapFilters } from '@/@types/map'
import { UserRole, User } from '@/@types/user'
import { City } from '@/@types/city'
import { DemandStatus, getDemandStatusData } from '@/@types/demand'

interface FiltersPanelProps {
  filters: MapFilters
  setFilters: React.Dispatch<React.SetStateAction<MapFilters>>
  cities: City[]
  allowedCityIds: string[]
  users: User[]
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  setFilters,
  cities,
  allowedCityIds,
  users
}) => {
  // Opções para o filtro de cidade
  const CITY_OPTIONS = cities
    .filter((city) => allowedCityIds.includes(city.id))
    .map((city) => ({
      label: city.name,
      value: city.id
    }))

  // Opções para o filtro de tipo de usuário
  const USER_ROLES_OPTIONS = Object.values(UserRole).map((role) => ({
    label: role,
    value: role
  }))

  // Opções para o filtro de bairro
  const BAIRRO_OPTIONS = Array.from(
    new Set(users.map((user) => user.profile?.bairro).filter(Boolean))
  ).map((bairro) => ({
    label: bairro,
    value: bairro
  }))

  // Opções para o filtro de vereador (base eleitoral)
  const VEREADOR_OPTIONS = users
    .filter((user) => user.role === UserRole.VEREADOR)
    .map((vereador) => ({
      label: vereador.profile?.nomeCompleto || vereador.id,
      value: vereador.id
    }))

  // Opções para o filtro de status de demanda
  const DAMAND_STATUS_OPTIONS = Object.values(DemandStatus).map((status) => ({
    label: getDemandStatusData(status).label,
    value: status
  }))

  return (
    <S.FiltersWrapper>
      {allowedCityIds.length > 1 && (
        <Select
          placeholder="Selecionar Cidade"
          value={filters.cityId}
          onChange={(value) => setFilters({ ...filters, cityId: value })}
          style={{ width: 180 }}
          allowClear
          options={CITY_OPTIONS}
        />
      )}
      <Select
        placeholder="Tipo de Usuário"
        mode="multiple"
        value={filters.userType}
        onChange={(value) => setFilters({ ...filters, userType: value })}
        style={{ width: 180 }}
        allowClear
        options={USER_ROLES_OPTIONS}
      />
      <Select
        placeholder="Bairro"
        value={filters.bairro}
        onChange={(value) => setFilters({ ...filters, bairro: value })}
        style={{ width: 120 }}
        allowClear
        options={BAIRRO_OPTIONS}
      />
      <Select
        placeholder="Base Eleitoral (Vereador)"
        value={filters.vereadorId}
        onChange={(value) => setFilters({ ...filters, vereadorId: value })}
        style={{ width: 180 }}
        allowClear
        options={VEREADOR_OPTIONS}
      />
      <Select
        placeholder="Status de Demanda"
        value={filters.demandStatus}
        onChange={(value) => setFilters({ ...filters, demandStatus: value })}
        style={{ width: 180 }}
        allowClear
        options={DAMAND_STATUS_OPTIONS}
      />
    </S.FiltersWrapper>
  )
}

export default FiltersPanel
