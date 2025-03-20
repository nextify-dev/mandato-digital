// src/components/FiltersPanel/index.tsx

import * as S from './styles'

import { Select, Checkbox, Input } from 'antd'
import { MapFilters } from '@/@types/map'
import { UserRole, User } from '@/@types/user'
import { City } from '@/@types/city'
import { DemandStatus } from '@/@types/demand'
const { Option } = Select

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
  const userTypeOptions = Object.values(UserRole).map((role) => ({
    label: role,
    value: role
  }))

  const bairroOptions = Array.from(
    new Set(users.map((user) => user.profile?.bairro).filter(Boolean))
  ).map((bairro) => ({
    label: bairro,
    value: bairro
  }))

  const vereadorOptions = users
    .filter((user) => user.role === UserRole.VEREADOR)
    .map((vereador) => ({
      label: vereador.profile?.nomeCompleto || vereador.id,
      value: vereador.id
    }))

  const demandStatusOptions = Object.values(DemandStatus).map((status) => ({
    label: status,
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
        >
          {cities
            .filter((city) => allowedCityIds.includes(city.id))
            .map((city) => (
              <Option key={city.id} value={city.id}>
                {city.name}
              </Option>
            ))}
        </Select>
      )}
      <Select
        placeholder="Tipo de Usuário"
        mode="multiple"
        value={filters.userType}
        onChange={(value) => setFilters({ ...filters, userType: value })}
        style={{ width: 180 }}
        allowClear
      >
        {userTypeOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      <Select
        placeholder="Bairro"
        value={filters.bairro}
        onChange={(value) => setFilters({ ...filters, bairro: value })}
        style={{ width: 120 }}
        allowClear
      >
        {bairroOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      <Select
        placeholder="Base Eleitoral (Vereador)"
        value={filters.vereadorId}
        onChange={(value) => setFilters({ ...filters, vereadorId: value })}
        style={{ width: 180 }}
        allowClear
      >
        {vereadorOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      <Select
        placeholder="Status de Demanda"
        value={filters.demandStatus}
        onChange={(value) => setFilters({ ...filters, demandStatus: value })}
        style={{ width: 180 }}
        allowClear
      >
        {demandStatusOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </S.FiltersWrapper>
  )
}

export default FiltersPanel
