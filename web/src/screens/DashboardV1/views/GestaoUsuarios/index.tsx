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

const { Search } = Input

const GestaoUsuariosViewContent = () => {
  const {
    users,
    loading,
    filters,
    setFilters,
    createUser,
    toggleUserStatus,
    deleteUser,
    updateUser
  } = useUsers()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const formRef = useRef<UseFormReturn<UserRegistrationFormType> | null>(null)

  const columns = [
    {
      title: 'Foto',
      key: 'foto',
      render: (_: any, record: User) => (
        <Avatar src={record.profile?.foto} size={32}>
          {record.profile?.nomeCompleto?.charAt(0) || 'U'}
        </Avatar>
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
      render: (_: any, record: User) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuUserPen />}
            onClick={() => {
              setSelectedUser(record)
              setIsEditModalOpen(true)
              setCurrentStep(0)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => deleteUser(record.id)}
          />
          <Button
            type="link"
            icon={record.status === 'ativo' ? <LuLockOpen /> : <LuLock />}
            onClick={() => {
              setSelectedUser(record)
              setIsConfirmModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedUser(record)
              setIsViewModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      ),
      width: 150
    }
  ]

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

  const ROLE_FILTER_OPTIONS = Object.values(UserRole)
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
              options={[{ label: 'Todos', value: '' }, ...ROLE_FILTER_OPTIONS]}
              onChange={handleRoleFilter}
              style={{ width: 200 }}
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
        size="large"
      >
        {isEditModalOpen && selectedUser && (
          <UserRegistrationForm
            onSubmit={handleEditUser}
            mode="userCreation"
            initialData={{ ...selectedUser.profile, role: selectedUser.role }}
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
            initialData={{ ...selectedUser.profile, role: selectedUser.role }}
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
