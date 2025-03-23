// src/screens/DashboardV1/views/RegistroVisitasView.tsx

import { useState, useRef, useEffect } from 'react'
import * as S from './styles'
import { LuPen, LuTrash2, LuEye } from 'react-icons/lu'
import { Button, Input, Tag, Select } from 'antd'
import { UseFormReturn } from 'react-hook-form'
import moment from 'moment'
import {
  View,
  Table,
  Modal,
  ConfirmModal,
  VisitRegistrationForm
} from '@/components'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { useVisits } from '@/contexts/VisitsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import {
  Visit,
  VisitStatus,
  getVisitStatusData,
  VisitRegistrationFormType
} from '@/@types/visit'
import { useCities } from '@/contexts/CitiesProvider'

const { Search } = Input

const RegistroVisitasView = () => {
  const { user } = useAuth()
  const { users, allUsers, getUserById } = useUsers()
  const {
    visits,
    loading,
    filters,
    setFilters,
    createVisit,
    updateVisit,
    deleteVisit,
    getInitialData
  } = useVisits()
  const { cities } = useCities()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<VisitRegistrationFormType> | null>(null)
  const [initialViewData, setInitialViewData] =
    useState<Partial<VisitRegistrationFormType> | null>(null)
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false)
  const formRef = useRef<UseFormReturn<VisitRegistrationFormType> | null>(null)

  const columns = [
    {
      title: 'Eleitor',
      dataIndex: 'voterId',
      key: 'voterId',
      render: (id: string) => getUserById(id)?.profile?.nomeCompleto
    },
    {
      title: 'Cidade',
      dataIndex: 'cityId',
      key: 'cityId',
      render: (id: string) => cities.find((city) => city.id === id)?.name || id
    },
    {
      title: 'Data e Horário',
      dataIndex: 'dateTime',
      key: 'dateTime',
      sorter: (a: Visit, b: Visit) => a.dateTime.localeCompare(b.dateTime),
      render: (dateTime: string) => moment(dateTime).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: VisitStatus) => (
        <Tag color={getVisitStatusData(status).color}>
          {getVisitStatusData(status).label}
        </Tag>
      )
    },
    {
      title: 'Motivo',
      key: 'reason',
      render: (_: any, record: Visit) => record.details.reason
    },
    {
      title: 'Vinculado a',
      key: 'relatedUserId',
      render: (_: any, record: Visit) =>
        allUsers.find((u) => u.id === record.details.relatedUserId)?.profile
          ?.nomeCompleto || record.details.relatedUserId
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Visit) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedVisit(record)
              setIsEditModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedVisit(record)
              setIsConfirmModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedVisit(record)
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
      if (selectedVisit) {
        setIsLoadingInitialData(true)
        try {
          const data = await getInitialData(selectedVisit)
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
  }, [selectedVisit, isEditModalOpen, isViewModalOpen, getInitialData])

  const handleModalClose = (type: 'create' | 'edit' | 'view') => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)

    if (formRef.current) {
      formRef.current.reset()
    }
    setCurrentStep(0)
    setSelectedVisit(null)
    setInitialEditData(null)
    setInitialViewData(null)
  }

  const handleSearch = (value: string) => {
    setFilters({ ...filters, voterId: value })
  }

  const handleStatusFilter = (value: string) => {
    setFilters({
      ...filters,
      status: value ? (value as VisitStatus) : undefined
    })
  }

  const handleUserFilter = (value: string) => {
    setFilters({ ...filters, relatedUserId: value || undefined })
  }

  const handleCityFilter = (value: string) => {
    setFilters({ ...filters, cityId: value || undefined })
  }

  const STATUS_FILTERED_OPTIONS = Object.values(VisitStatus).map((status) => ({
    label: getVisitStatusData(status).label,
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

  const handleCreateVisit = async (data: VisitRegistrationFormType) => {
    await createVisit(data)
    handleModalClose('create')
  }

  const handleEditVisit = async (data: VisitRegistrationFormType) => {
    if (selectedVisit) {
      const { voterId, dateTime, ...editableData } = data
      await updateVisit(selectedVisit.id, editableData)
      handleModalClose('edit')
    }
  }

  const handleDeleteVisit = async () => {
    if (selectedVisit) {
      await deleteVisit(selectedVisit.id)
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
            <Select
              placeholder="Filtrar por cidade"
              options={CITY_FILTERED_OPTIONS}
              onChange={handleCityFilter}
              style={{ width: 150 }}
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
              placeholder="Filtrar por usuário vinculado"
              options={USER_FILTERED_OPTIONS}
              onChange={handleUserFilter}
              style={{ width: 200 }}
            />
          </S.SearchWrapper>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Nova Visita
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={visits}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Criação de Nova Visita"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isCreateModalOpen && (
          <VisitRegistrationForm
            onSubmit={handleCreateVisit}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={isLoadingInitialData || loading}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Visita"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isEditModalOpen && selectedVisit && initialEditData && (
          <VisitRegistrationForm
            onSubmit={handleEditVisit}
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
        title="Visualização de Visita"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isViewModalOpen && selectedVisit && initialViewData && (
          <VisitRegistrationForm
            mode="viewOnly"
            initialData={initialViewData}
            currentStep={0}
            setCurrentStep={() => {}}
          />
        )}
      </Modal>

      <ConfirmModal
        type="danger"
        title="Confirmação de Exclusão"
        content={`Deseja excluir a visita ${
          selectedVisit?.voterId
            ? `de ${getUserById(selectedVisit?.voterId)?.profile?.nomeCompleto}`
            : 'selecionada'
        }? Essa ação não poderá ser desfeita.`}
        visible={isConfirmModalOpen}
        onConfirm={handleDeleteVisit}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

export default RegistroVisitasView
