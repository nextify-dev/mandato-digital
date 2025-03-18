// src/screens/DashboardV1/views/RegistroVisitasView.tsx

import { useState, useRef, useEffect } from 'react'
import * as S from './styles'
import { Button, Input, Tag, Select } from 'antd'
import { LuPen, LuTrash2, LuEye } from 'react-icons/lu'
import {
  View,
  Table,
  Modal,
  ConfirmModal,
  VisitRegistrationForm
} from '@/components'
import {
  Visit,
  VisitStatus,
  getVisitStatusData,
  VisitRegistrationFormType
} from '@/@types/visit'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { UseFormReturn } from 'react-hook-form'
import { useVisits } from '@/contexts/VisitsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import moment from 'moment'

const { Search } = Input

const RegistroVisitasView = () => {
  const { user } = useAuth()
  const { allUsers } = useUsers()
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
      render: (id: string) =>
        allUsers.find((u) => u.id === id)?.profile?.nomeCompleto || id
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
              setCurrentStep(0)
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
          if (isEditModalOpen) setInitialEditData(data)
          else if (isViewModalOpen) setInitialViewData(data)
        } catch (error) {
          console.error('Erro ao buscar dados iniciais:', error)
        } finally {
          setIsLoadingInitialData(false)
        }
      }
    }
    fetchInitialData()
  }, [selectedVisit, isEditModalOpen, isViewModalOpen, getInitialData])

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

  const STATUS_FILTERED_OPTIONS = Object.values(VisitStatus).map((status) => ({
    label: getVisitStatusData(status).label,
    value: status
  }))

  const USER_FILTERED_OPTIONS = [
    { label: 'Todos', value: '' },
    ...allUsers.map((user) => ({
      label: `${user.profile?.nomeCompleto} (${user.role})`,
      value: user.id
    }))
  ]

  const handleCreateVisit = async (data: VisitRegistrationFormType) => {
    await createVisit(data)
    setIsCreateModalOpen(false)
  }

  const handleEditVisit = async (data: VisitRegistrationFormType) => {
    if (selectedVisit) {
      const { voterId, dateTime, ...editableData } = data
      await updateVisit(selectedVisit.id, editableData)
      setIsEditModalOpen(false)
    }
  }

  const handleDeleteVisit = async () => {
    if (selectedVisit) {
      await deleteVisit(selectedVisit.id)
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
    setSelectedVisit(null)
    setInitialEditData(null)
    setInitialViewData(null)
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
      >
        {isCreateModalOpen && (
          <VisitRegistrationForm
            onSubmit={handleCreateVisit}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Visita"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
        confirmLoading={isLoadingInitialData}
      >
        {isEditModalOpen && selectedVisit && initialEditData && (
          <VisitRegistrationForm
            onSubmit={handleEditVisit}
            mode="edit"
            initialData={initialEditData}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Visita"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
        confirmLoading={isLoadingInitialData}
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
        content={`Deseja excluir a visita de ${
          selectedVisit?.voterId || 'selecionada'
        }?`}
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
