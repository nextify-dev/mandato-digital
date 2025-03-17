import { useState, useRef } from 'react'
import * as S from './styles'
import {
  LuUserPen,
  LuTrash2,
  LuLock,
  LuLockOpen,
  LuEye,
  LuUserX
} from 'react-icons/lu'
import { Button, Input, Select, Tag, Avatar } from 'antd'
import {
  View,
  Table,
  Modal,
  UserRegistrationForm,
  ConfirmModal
} from '@/components'
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
import { useUsers } from '@/contexts/UsersProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'

const { Search } = Input

const GestaoUsuariosView = () => {
  const { user } = useAuth()
  const { cities } = useCities()
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
  const [isRemoveRoleModalOpen, setIsRemoveRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<
    'toggleStatus' | 'delete' | null
  >(null)
  const [currentStep, setCurrentStep] = useState(0)
  const formRef = useRef<UseFormReturn<UserRegistrationFormType> | null>(null)

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
      key: 'cidade',
      render: (_: any, record: User) => {
        const city = cities.find((c) => c.id === record.cityId)
        return city ? city.name : 'N/A'
      }
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
              disabled={isCurrentUser || !user?.permissions.canEditUsers}
            />
            <Button
              type="link"
              icon={<LuTrash2 />}
              danger
              onClick={() => {
                setSelectedUser(record)
                setActionType('delete')
                setIsConfirmModalOpen(true)
              }}
              disabled={
                !user?.permissions.canEditUsers || record.id === user?.id
              }
            />
            <Button
              type="link"
              icon={
                record.status === UserStatus.ATIVO ? <LuLock /> : <LuLockOpen />
              }
              onClick={() => {
                setSelectedUser(record)
                setActionType('toggleStatus')
                setIsConfirmModalOpen(true)
              }}
              disabled={isCurrentUser || !user?.permissions.canEditUsers}
            />
            <Button
              type="link"
              icon={<LuEye />}
              onClick={() => {
                setSelectedUser(record)
                setIsViewModalOpen(true)
              }}
            />
            {record.role !== UserRole.ELEITOR && (
              <Button
                type="link"
                icon={<LuUserX />}
                onClick={() => {
                  setSelectedUser(record)
                  setIsRemoveRoleModalOpen(true)
                }}
                disabled={isCurrentUser || !user?.permissions.canEditUsers}
              />
            )}
          </TableExtrasWrapper>
        )
      },
      width: 180
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
    ...cities.map((city) => ({
      label: `${city.name} - ${city.state}`,
      value: city.id
    }))
  ]

  const handleCreateUser = async (
    data: UserRegistrationFormType & { cityId?: string }
  ) => {
    const cityId = data.cityId ?? user?.cityId
    if (!cityId) throw new Error('Nenhuma cidade associada ao usuário')
    await createUser(data, cityId, 'userCreation')
    setIsCreateModalOpen(false)
  }

  const handleEditUser = async (
    data: UserRegistrationFormType & { cityId?: string }
  ) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, {
        nomeCompleto: data.nomeCompleto,
        cpf: data.cpf,
        dataNascimento: data.dataNascimento,
        genero: data.genero,
        religiao: data.religiao,
        foto: data.foto,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        facebook: data.facebook,
        cep: data.cep,
        endereco: data.endereco,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        role: data.role as UserRole
      })
      setIsEditModalOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    if (selectedUser) {
      await toggleUserStatus(selectedUser.id)
      setIsConfirmModalOpen(false)
      setActionType(null)
      setSelectedUser(null)
    }
  }

  const handleDeleteUser = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id)
      setIsConfirmModalOpen(false)
      setActionType(null)
      setSelectedUser(null)
    }
  }

  const handleRemoveRole = async () => {
    if (selectedUser) {
      await updateUser(selectedUser.id, { role: UserRole.ELEITOR })
      setIsRemoveRoleModalOpen(false)
      setSelectedUser(null)
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

  if (
    !user?.permissions.canManageCityUsers &&
    user?.role !== UserRole.ADMINISTRADOR_GERAL
  ) {
    return <div>Acesso restrito a administradores de cidade ou gerais.</div>
  }

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
              style={{ width: 200 }}
              disabled={user?.role !== UserRole.ADMINISTRADOR_GERAL}
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
            mode="voterCreation"
            initialData={getInitialData(selectedUser)}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

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

      <ConfirmModal
        type="warning"
        title={
          actionType === 'toggleStatus'
            ? selectedUser?.status === UserStatus.ATIVO
              ? 'Confirmação de Bloqueio'
              : 'Confirmação de Desbloqueio'
            : 'Confirmação de Exclusão'
        }
        content={
          actionType === 'toggleStatus'
            ? `Deseja ${
                selectedUser?.status === UserStatus.ATIVO
                  ? 'bloquear'
                  : 'desbloquear'
              } o usuário ${
                selectedUser?.profile?.nomeCompleto || 'selecionado'
              }?`
            : `Deseja excluir o usuário ${
                selectedUser?.profile?.nomeCompleto || 'selecionado'
              }?`
        }
        visible={isConfirmModalOpen}
        onConfirm={
          actionType === 'toggleStatus' ? handleToggleStatus : handleDeleteUser
        }
        onCancel={() => {
          setIsConfirmModalOpen(false)
          setActionType(null)
          setSelectedUser(null)
        }}
        confirmText="Sim"
        cancelText="Não"
      />

      <ConfirmModal
        type="warning"
        title="Confirmação de Remoção de Cargo"
        content={
          selectedUser
            ? `Deseja remover o cargo de ${
                getRoleData(selectedUser.role).label
              } do usuário ${
                selectedUser.profile?.nomeCompleto || 'selecionado'
              } na cidade ${
                cities.find((c) => c.id === selectedUser.cityId)?.name || 'N/A'
              } e torná-lo um Eleitor?`
            : 'Deseja remover o cargo do usuário selecionado?'
        }
        visible={isRemoveRoleModalOpen}
        onConfirm={handleRemoveRole}
        onCancel={() => {
          setIsRemoveRoleModalOpen(false)
          setSelectedUser(null)
        }}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

export default GestaoUsuariosView
