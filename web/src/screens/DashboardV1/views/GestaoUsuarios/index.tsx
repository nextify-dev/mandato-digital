// src/screens/DashboardV1/views/GestaoUsuarios/index.tsx

import { useState, useRef } from 'react'
import * as S from './styles'
import { LuUserPen, LuTrash2, LuLock, LuLockOpen, LuEye } from 'react-icons/lu'
import { Button, Input, Select, Tag, Avatar } from 'antd'
import {
  View,
  Table,
  Modal,
  UserRegistrationForm,
  ConfirmModal
} from '@/components'
import { UsersProvider, useUsers } from '@/contexts/UsersProvider'
import {
  getRoleData,
  getStatusData,
  User,
  UserRegistrationFormType,
  UserRole,
  UserStatus
} from '@/@types/user'
import { applyMask } from '@/utils/functions/masks'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { UseFormReturn } from 'react-hook-form'
import { StyledAvatar } from '@/utils/styles/antd'
import { useAuth } from '@/contexts/AuthProvider'

const { Search } = Input

const GestaoUsuariosViewContent = () => {
  // ============================================= STATES | REFS | CONTEXTS | HOOK

  const { user } = useAuth()
  const {
    users,
    loading,
    filters,
    setFilters,
    createUser,
    toggleUserStatus,
    deleteUser,
    updateUser,
    getInitialData
  } = useUsers()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const formRef = useRef<UseFormReturn<UserRegistrationFormType> | null>(null)

  // ============================================= TABELA

  const columns = [
    {
      title: 'Foto',
      key: 'foto',
      render: (_: any, record: User) => (
        <StyledAvatar src={record.profile?.foto} size={32}>
          {record.profile?.nomeCompleto?.charAt(0) || 'U'}
        </StyledAvatar>
      ),
      width: 65
    },
    {
      title: 'Nome',
      dataIndex: ['profile', 'nomeCompleto'],
      key: 'nomeCompleto',
      sorter: (a: User, b: User) =>
        (a.profile?.nomeCompleto || '').localeCompare(
          b.profile?.nomeCompleto || ''
        )
    },
    {
      title: 'WhatsApp',
      dataIndex: ['profile', 'whatsapp'],
      key: 'whatsapp',
      render: (whatsapp: string) =>
        whatsapp ? applyMask(whatsapp, 'phone') : 'N/A',
      width: 130
    },
    {
      title: 'Cidade',
      dataIndex: ['profile', 'cidade'],
      key: 'cidade'
    },
    {
      title: 'Cargo',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={getRoleData(role).color}>{getRoleData(role).label}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={getStatusData(status).color}>
          {getStatusData(status).label}
        </Tag>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: User) => {
        const isCurrentUser = record.id === user?.id
        return (
          <TableExtrasWrapper>
            <Button
              type="link"
              icon={<LuUserPen />}
              onClick={() => {
                setSelectedUser(record)
                setIsEditModalOpen(true)
                setCurrentStep(0)
              }}
              disabled={isCurrentUser}
            />
            <Button
              type="link"
              icon={<LuTrash2 />}
              danger
              onClick={() => deleteUser(record.id)}
              disabled={isCurrentUser}
            />
            <Button
              type="link"
              icon={record.status === 'ativo' ? <LuLockOpen /> : <LuLock />}
              onClick={() => {
                setSelectedUser(record)
                setIsConfirmModalOpen(true)
              }}
              disabled={isCurrentUser}
            />
            <Button
              type="link"
              icon={<LuEye />}
              onClick={() => {
                setSelectedUser(record)
                setIsViewModalOpen(true)
              }}
              disabled={isCurrentUser}
            />
          </TableExtrasWrapper>
        )
      },
      width: 150
    }
  ]

  // ============================================= FILTROS

  const handleSearch = (value: string) => {
    setFilters({
      ...filters,
      name: value,
      email: value
    })
  }

  const handleRoleFilter = (value: string) => {
    setFilters({ ...filters, role: value ? (value as UserRole) : undefined })
  }

  const handleStatusFilter = (value: string) => {
    setFilters({
      ...filters,
      status: value ? (value as UserStatus) : undefined
    })
  }

  const handleCityFilter = (value: string) => {
    setFilters({ ...filters, cityId: value || undefined })
  }

  const ROLE_FILTERED_OPTIONS = Object.values(UserRole)
    .filter((role) => role !== UserRole.ELEITOR)
    .map((role) => ({
      label: getRoleData(role).label,
      value: role
    }))

  const STATUS_FILTERED_OPTIONS = Object.values(UserStatus).map((status) => ({
    label: getStatusData(status).label,
    value: status
  }))

  const CITY_FILTERED_OPTIONS = [
    { label: 'Todas', value: '' },
    { label: 'Cidade A', value: 'cityA' },
    { label: 'Cidade B', value: 'cityB' }
  ]

  // ============================================= FUNÇÕES

  const handleCreateUser = async (data: UserRegistrationFormType) => {
    await createUser(data, 'default_city', 'userCreation')
    setIsCreateModalOpen(false)
  }

  const handleEditUser = async (data: UserRegistrationFormType) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, {
        ...data,
        role: data.role as UserRole
      })
      setIsEditModalOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    if (selectedUser) {
      await toggleUserStatus(selectedUser.id)
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
    setSelectedUser(null)
  }

  const ROLE_FILTER_OPTIONS_DATA = Object.values(UserRole)
    .filter((role) => role !== UserRole.ELEITOR)
    .map((role) => ({
      label: getRoleData(role).label,
      value: role
    }))

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.SearchWrapper>
            <Search
              placeholder="Pesquisar por nome ou email"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filtrar por cargo"
              options={[
                { label: 'Todos', value: '' },
                ...ROLE_FILTERED_OPTIONS
              ]}
              onChange={handleRoleFilter}
              style={{ width: 200 }}
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
              placeholder="Filtrar por cidade"
              options={CITY_FILTERED_OPTIONS}
              onChange={handleCityFilter}
              style={{ width: 150 }}
            />
          </S.SearchWrapper>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Novo Usuário
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        disabledRowKey={user?.id}
      />

      {/* Modal de Criação */}
      <Modal
        title="Criação de Novo Usuário"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="large"
      >
        {isCreateModalOpen && (
          <UserRegistrationForm
            onSubmit={handleCreateUser}
            mode="userCreation"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      {/* Modal de Edição */}
      <Modal
        title="Edição de Usuário"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
      >
        {isEditModalOpen && selectedUser && (
          <UserRegistrationForm
            onSubmit={handleEditUser}
            mode="voterCreation"
            initialData={getInitialData(selectedUser)}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        title="Visualização de Usuário"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
      >
        {isViewModalOpen && selectedUser && (
          <UserRegistrationForm
            mode="viewOnly"
            initialData={getInitialData(selectedUser)}
            currentStep={0}
            setCurrentStep={() => {}}
          />
        )}
      </Modal>

      {/* Modal de Confirmação */}
      <ConfirmModal
        type="warning"
        title="Confirmação de Alteração de Status"
        content={`Deseja ${
          selectedUser?.status === 'ativo' ? 'bloquear' : 'desbloquear'
        } o usuário ${selectedUser?.profile?.nomeCompleto || 'selecionado'}?`}
        visible={isConfirmModalOpen}
        onConfirm={handleToggleStatus}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

const GestaoUsuariosView = () => (
  <UsersProvider>
    <GestaoUsuariosViewContent />
  </UsersProvider>
)

export default GestaoUsuariosView
