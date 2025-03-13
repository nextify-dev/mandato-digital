// src/screens/DashboardV1/views/GestaoUsuarios/index.tsx

import { useState, useRef } from 'react'
import * as S from './styles'
import { LuUserPen, LuTrash2, LuLock, LuLockOpen, LuEye } from 'react-icons/lu'
import { Button, Input, Select, Tag, Avatar } from 'antd'
import { View, Table, Modal, UserRegistrationForm } from '@/components'
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
    deleteUser
  } = useUsers()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // Estado para controlar a etapa do formulário
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
        whatsapp ? applyMask(whatsapp, 'phone') : 'N/A', // Adicionado fallback
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
            onClick={() => console.log('Editar', record.id)}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => deleteUser(record.id)}
          />
          <Button
            type="link"
            icon={record.status === 'ativo' ? <LuLock /> : <LuLockOpen />}
            onClick={() => toggleUserStatus(record.id)}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => console.log('Visualizar', record.id)}
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
    setIsModalOpen(false)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    if (formRef.current) {
      formRef.current.reset() // Resetar o formulário
      setCurrentStep(0) // Voltar para a primeira etapa
    }
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
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
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
      <Modal
        title="Novo Cadastro de Usuário"
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        size="large"
      >
        {isModalOpen && (
          <UserRegistrationForm
            onSubmit={handleCreateUser}
            mode="userCreation"
            ref={formRef}
            currentStep={currentStep} // Passar o estado da etapa
            setCurrentStep={setCurrentStep} // Passar a função para atualizar a etapa
          />
        )}
      </Modal>
    </View>
  )
}

const GestaoUsuariosView = () => (
  <UsersProvider>
    <GestaoUsuariosViewContent />
  </UsersProvider>
)

export default GestaoUsuariosView
