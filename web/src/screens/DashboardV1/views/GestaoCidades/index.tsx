// src/screens/DashboardV1/views/GestaoCidades.tsx

import { useState, useRef, useEffect } from 'react'
import * as S from './styles'
import { Button, Input, Tag, Avatar, Select } from 'antd'
import { LuPen, LuTrash2, LuEye } from 'react-icons/lu'
import {
  View,
  Table,
  Modal,
  ConfirmModal,
  CityRegistrationForm
} from '@/components'
import {
  City,
  CityStatus,
  getCityStatusData,
  CityRegistrationFormType as BaseCityRegistrationFormType
} from '@/@types/city'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { UseFormReturn } from 'react-hook-form'
import { StyledAvatar } from '@/utils/styles/antd'
import { useCities } from '@/contexts/CitiesProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import { UserRole } from '@/@types/user'

interface CityRegistrationFormTypeExtended
  extends BaseCityRegistrationFormType {
  administratorId?: string | null
  mayorId?: string | null
  vereadorIds?: string[]
  caboEleitoralIds?: string[]
}

const { Search } = Input

const GestaoCidadesView = () => {
  const { user } = useAuth()
  const { users } = useUsers()
  const {
    cities,
    loading,
    filters,
    setFilters,
    createCity,
    updateCity,
    deleteCity,
    getInitialData
  } = useCities()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<CityRegistrationFormTypeExtended> | null>(null)
  const [initialViewData, setInitialViewData] =
    useState<Partial<CityRegistrationFormTypeExtended> | null>(null)
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false)
  const formRef =
    useRef<UseFormReturn<CityRegistrationFormTypeExtended> | null>(null)

  const columns = [
    {
      title: 'Logo',
      key: 'logo',
      render: (_: any, record: City) => (
        <StyledAvatar size={32}>{record.name.charAt(0) || 'C'}</StyledAvatar>
      ),
      width: 65
    },
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: City, b: City) => a.name.localeCompare(b.name)
    },
    {
      title: 'Estado',
      dataIndex: 'state',
      key: 'state'
    },
    {
      title: 'Administrador',
      key: 'administrator',
      render: (_: any, record: City) => {
        const admin = users.find(
          (u) =>
            u.role === UserRole.ADMINISTRADOR_CIDADE && u.cityId === record.id
        )
        return admin ? admin.profile?.nomeCompleto : '-'
      }
    },
    {
      title: 'Prefeito',
      key: 'mayor',
      render: (_: any, record: City) => {
        const mayor = users.find(
          (u) => u.role === UserRole.PREFEITO && u.cityId === record.id
        )
        return mayor ? mayor.profile?.nomeCompleto : '-'
      }
    },
    {
      title: 'Total de Vereadores',
      key: 'totalVereadores',
      render: (_: any, record: City) => (
        <Tag color="purple">{record.details.totalVereadores ?? 0}</Tag>
      )
    },
    {
      title: 'Total de Cabos Eleitorais',
      key: 'totalCabosEleitorais',
      render: (_: any, record: City) => (
        <Tag color="orange">{record.details.totalCabosEleitorais ?? 0}</Tag>
      )
    },
    {
      title: 'Total de Eleitores',
      key: 'totalVoters',
      render: (_: any, record: City) => (
        <Tag color="green">{record.details.totalVoters ?? 0}</Tag>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: City) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedCity(record)
              setIsEditModalOpen(true)
              setCurrentStep(0)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedCity(record)
              setIsConfirmModalOpen(true)
            }}
            disabled={
              (record.details.totalUsers ?? 0) > 0 ||
              (record.details.totalVoters ?? 0) > 0
            }
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedCity(record)
              setIsViewModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      ),
      width: 150
    }
  ]

  useEffect(() => {
    const fetchInitialData = async () => {
      if (selectedCity) {
        setIsLoadingInitialData(true)
        try {
          const data = await getInitialData(selectedCity)
          if (isEditModalOpen) {
            setInitialEditData(data)
          } else if (isViewModalOpen) {
            setInitialViewData(data)
          }
        } catch (error) {
          console.error('Erro ao buscar dados iniciais:', error)
        } finally {
          setIsLoadingInitialData(false)
        }
      }
    }

    fetchInitialData()
  }, [selectedCity, isEditModalOpen, isViewModalOpen, getInitialData])

  const handleSearch = (value: string) => {
    setFilters({ ...filters, name: value })
  }

  const handleStatusFilter = (value: string) => {
    setFilters({
      ...filters,
      status: value ? (value as CityStatus) : undefined
    })
  }

  const handleStateFilter = (value: string) => {
    setFilters({ ...filters, state: value || undefined })
  }

  const STATUS_FILTERED_OPTIONS = Object.values(CityStatus).map((status) => ({
    label: getCityStatusData(status).label,
    value: status
  }))

  const STATE_FILTERED_OPTIONS = [
    { label: 'Todos', value: '' },
    ...Array.from(new Set(cities.map((city) => city.state))).map((state) => ({
      label: state,
      value: state
    }))
  ]

  const handleCreateCity = async (data: CityRegistrationFormTypeExtended) => {
    await createCity(data)
    setIsCreateModalOpen(false)
  }

  const handleEditCity = async (data: CityRegistrationFormTypeExtended) => {
    if (selectedCity) {
      const { name, state, ...editableData } = data
      await updateCity(selectedCity.id, editableData)
      setIsEditModalOpen(false)
    }
  }

  const handleDeleteCity = async () => {
    if (selectedCity) {
      await deleteCity(selectedCity.id)
      setIsConfirmModalOpen(false)
    }
  }

  const handleModalClose = (type: 'create' | 'edit' | 'view') => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)
    if (formRef.current) {
      formRef.current.reset()
      setCurrentStep(0)
    }
    setSelectedCity(null)
    setInitialEditData(null)
    setInitialViewData(null)
  }

  if (user?.role !== UserRole.ADMINISTRADOR_GERAL) {
    return <div>Acesso restrito ao Administrador Geral.</div>
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.SearchWrapper>
            <Search
              placeholder="Pesquisar por nome da cidade"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filtrar por status"
              options={[
                { label: 'Todos', value: '' },
                ...STATUS_FILTERED_OPTIONS
              ]}
              onChange={handleStatusFilter}
              style={{ width: 150 }}
            />
            <Select
              placeholder="Filtrar por estado"
              options={STATE_FILTERED_OPTIONS}
              onChange={handleStateFilter}
              style={{ width: 150 }}
            />
          </S.SearchWrapper>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Nova Cidade
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={cities}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Criação de Nova Cidade"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
      >
        {isCreateModalOpen && (
          <CityRegistrationForm
            onSubmit={handleCreateCity}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Cidade"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
        confirmLoading={isLoadingInitialData}
      >
        {isEditModalOpen && selectedCity && initialEditData && (
          <CityRegistrationForm
            onSubmit={handleEditCity}
            mode="edit"
            initialData={initialEditData}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Cidade"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
        confirmLoading={isLoadingInitialData}
      >
        {isViewModalOpen && selectedCity && initialViewData && (
          <CityRegistrationForm
            mode="viewOnly"
            initialData={initialViewData}
            currentStep={0}
            setCurrentStep={() => {}}
          />
        )}
      </Modal>

      <ConfirmModal
        type="warning"
        title="Confirmação de Exclusão"
        content={`Deseja excluir a cidade ${
          selectedCity?.name || 'selecionada'
        }?`}
        visible={isConfirmModalOpen}
        onConfirm={handleDeleteCity}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

export default GestaoCidadesView
