// src/screens/DashboardV1/views/DemandasEleitoraisView/index.tsx

import { useState, useRef, useEffect } from 'react'
import * as S from './styles'
import { LuPen, LuTrash2, LuEye, LuHistory } from 'react-icons/lu'
import { Button, Input, Tag, Select } from 'antd'
import { UseFormReturn } from 'react-hook-form'
import moment from 'moment'
import {
  View,
  Table,
  Modal,
  ConfirmModal,
  DemandRegistrationForm
} from '@/components'
import DemandasUpdates from '@/components/DemandasUpdates' // Importação do novo componente
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { useDemands } from '@/contexts/DemandsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import {
  Demand,
  DemandStatus,
  getDemandStatusData,
  DemandRegistrationFormType
} from '@/@types/demand'
import { useCities } from '@/contexts/CitiesProvider'
import { UserRole } from '@/@types/user'

const { Search } = Input

const DemandasEleitoraisView = () => {
  const { user } = useAuth()
  const { users, allUsers, getUserById } = useUsers()
  const {
    demands,
    loading,
    filters,
    setFilters,
    createDemand,
    updateDemand,
    deleteDemand,
    getInitialData
  } = useDemands()
  const { cities } = useCities()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<DemandRegistrationFormType> | null>(null)
  const [initialViewData, setInitialViewData] =
    useState<Partial<DemandRegistrationFormType> | null>(null)
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false)
  const formRef = useRef<UseFormReturn<DemandRegistrationFormType> | null>(null)

  const columns = [
    {
      title: 'Protocolo',
      dataIndex: 'protocol',
      key: 'protocol'
    },
    {
      title: 'Eleitor',
      dataIndex: 'voterId',
      key: 'voterId',
      render: (id: string) =>
        allUsers.find((u) => u.id === id)?.profile?.nomeCompleto || id
    },
    {
      title: 'Cidade',
      dataIndex: 'cityId',
      key: 'cityId',
      render: (id: string) => cities.find((city) => city.id === id)?.name || id
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: DemandStatus) => (
        <Tag color={getDemandStatusData(status).color}>
          {getDemandStatusData(status).label}
        </Tag>
      )
    },
    {
      title: 'Data de Criação',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: Demand, b: Demand) => a.createdAt.localeCompare(b.createdAt),
      render: (createdAt: string) =>
        moment(createdAt).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Vinculado a',
      key: 'relatedUserId',
      render: (_: any, record: Demand) =>
        allUsers.find((u) => u.id === record.relatedUserId)?.profile
          ?.nomeCompleto || record.relatedUserId
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Demand) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedDemand(record)
              setIsEditModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedDemand(record)
              setIsConfirmModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedDemand(record)
              setIsViewModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuHistory />}
            onClick={() => {
              setSelectedDemand(record)
              setIsHistoryModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      ),
      width: 200
    }
  ]

  useEffect(() => {
    const fetchInitialData = async () => {
      if (selectedDemand) {
        setIsLoadingInitialData(true)
        try {
          const data = await getInitialData(selectedDemand)
          if (isEditModalOpen) {
            setInitialEditData(data)
            setCurrentStep(0)
          } else if (isViewModalOpen) {
            setInitialViewData(data)
            setCurrentStep(0)
          }
        } catch (error) {
          console.error('Erro ao buscar dados iniciais:', error)
        } finally {
          setIsLoadingInitialData(false)
        }
      }
    }
    fetchInitialData()
  }, [selectedDemand, isEditModalOpen, isViewModalOpen, getInitialData])

  const handleModalClose = (type: 'create' | 'edit' | 'view' | 'history') => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)
    if (type === 'history') setIsHistoryModalOpen(false)

    if (formRef.current) {
      formRef.current.reset()
    }
    setCurrentStep(0)
    setSelectedDemand(null)
    setInitialEditData(null)
    setInitialViewData(null)
  }

  const handleSearch = (value: string) => {
    setFilters({ ...filters, voterId: value })
  }

  const handleStatusFilter = (value: string) => {
    setFilters({
      ...filters,
      status: value ? (value as DemandStatus) : undefined
    })
  }

  const handleUserFilter = (value: string) => {
    setFilters({ ...filters, relatedUserId: value || undefined })
  }

  const handleCityFilter = (value: string) => {
    setFilters({ ...filters, cityId: value || undefined })
  }

  const STATUS_FILTERED_OPTIONS = Object.values(DemandStatus).map((status) => ({
    label: getDemandStatusData(status).label,
    value: status
  }))

  const USER_FILTERED_OPTIONS = [
    { label: 'Todos', value: '' },
    ...users.map((user) => ({
      label: `${user.profile?.nomeCompleto} (${user.role})`,
      value: user.id
    }))
  ]

  const CITY_FILTERED_OPTIONS = [
    { label: 'Todas', value: '' },
    ...cities.map((city) => ({
      label: city.name,
      value: city.id
    }))
  ]

  const handleCreateDemand = async (data: DemandRegistrationFormType) => {
    await createDemand(data)
    handleModalClose('create')
  }

  const handleEditDemand = async (data: DemandRegistrationFormType) => {
    if (selectedDemand) {
      const { voterId, ...editableData } = data
      await updateDemand(selectedDemand.id, editableData)
      handleModalClose('edit')
    }
  }

  const handleDeleteDemand = async () => {
    if (selectedDemand) {
      await deleteDemand(selectedDemand.id)
      setIsConfirmModalOpen(false)
    }
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.SearchWrapper>
            <Search
              placeholder="Pesquisar por eleitor"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            {user?.role === UserRole.ADMINISTRADOR_GERAL && (
              <Select
                placeholder="Filtrar por cidade"
                options={CITY_FILTERED_OPTIONS}
                onChange={handleCityFilter}
                style={{ width: 150 }}
              />
            )}
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
              placeholder="Filtrar por usuário vinculado"
              options={USER_FILTERED_OPTIONS}
              onChange={handleUserFilter}
              style={{ width: 200 }}
            />
          </S.SearchWrapper>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Nova Demanda
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={demands}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Criação de Nova Demanda"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isCreateModalOpen && (
          <DemandRegistrationForm
            onSubmit={handleCreateDemand}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={isLoadingInitialData || loading}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Demanda"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isEditModalOpen && selectedDemand && initialEditData && (
          <DemandRegistrationForm
            onSubmit={handleEditDemand}
            mode="edit"
            initialData={initialEditData}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={isLoadingInitialData || loading}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Demanda"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isViewModalOpen && selectedDemand && initialViewData && (
          <DemandRegistrationForm
            mode="viewOnly"
            initialData={initialViewData}
            currentStep={0}
            setCurrentStep={() => {}}
          />
        )}
      </Modal>

      <Modal
        title="Histórico de Atualizações"
        open={isHistoryModalOpen}
        onCancel={() => handleModalClose('history')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isHistoryModalOpen && selectedDemand && (
          <DemandasUpdates
            description={selectedDemand.description}
            updates={selectedDemand.details?.updates}
          />
        )}
      </Modal>

      <ConfirmModal
        type="danger"
        title="Confirmação de Exclusão"
        content={`Deseja excluir a demanda ${
          selectedDemand?.voterId
            ? `de ${
                getUserById(selectedDemand?.voterId)?.profile?.nomeCompleto
              }`
            : 'selecionada'
        }? Essa ação não poderá ser desfeita.`}
        visible={isConfirmModalOpen}
        onConfirm={handleDeleteDemand}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

export default DemandasEleitoraisView
