// src/screens/DashboardV1/views/GestaoEleitores.tsx

import { useState, useRef } from 'react'
import * as S from './styles'
import { Button, Input, Select, Tag, Avatar } from 'antd'
import { LuUserPen, LuTrash2, LuLock, LuLockOpen, LuEye } from 'react-icons/lu'
import {
  View,
  Table,
  Modal,
  UserRegistrationForm,
  ConfirmModal
} from '@/components'
import {
  getStatusData,
  User,
  UserRegistrationFormType,
  UserProfile,
  UserStatus,
  UserRole
} from '@/@types/user'
import { GENDER_OPTIONS, getGenderLabel } from '@/data/options'
import { applyMask } from '@/utils/functions/masks'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { UseFormReturn } from 'react-hook-form'
import { StyledAvatar } from '@/utils/styles/antd'
import { useUsers } from '@/contexts/UsersProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { getInitialFormData } from '@/utils/functions/formData'

const { Search } = Input

const CadastroEleitoresView = () => {
  const { user } = useAuth()
  const { cities } = useCities()
  const {
    voters,
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const formRef = useRef<UseFormReturn<UserRegistrationFormType> | null>(null)

  const columns = [
    {
      title: 'Foto',
      key: 'foto',
      render: (_: any, record: User) => (
        <StyledAvatar src={record.profile?.foto} size={32}>
          {record.profile?.nomeCompleto?.charAt(0) || 'E'}
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
      title: 'Gênero',
      dataIndex: ['profile', 'genero'],
      key: 'genero',
      render: (genero: string) => (
        <Tag color="blue">{getGenderLabel(genero)}</Tag>
      )
    },
    {
      title: 'Idade',
      dataIndex: ['profile', 'dataNascimento'],
      key: 'idade',
      render: (dataNascimento: string) =>
        dataNascimento ? applyMask(dataNascimento, 'ageFromISO') : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, record: User) => (
        <Tag color={getStatusData(record.status).color}>
          {getStatusData(record.status).label}
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
                setIsDeleteModalOpen(true)
              }}
              disabled={
                !user?.permissions.canEditUsers || record.id === user?.id
              }
            />
            <Button
              type="link"
              icon={record.status === 'ativo' ? <LuLockOpen /> : <LuLock />}
              onClick={() => {
                setSelectedUser(record)
                setIsConfirmModalOpen(true)
              }}
              disabled={
                isCurrentUser ||
                !user?.permissions.canEditUsers ||
                record.status !== UserStatus.ATIVO
              }
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
        )
      },
      width: 150
    }
  ]

  const handleSearch = (value: string) => {
    setFilters({
      ...filters,
      name: value,
      cpf: value
    })
  }

  const handleGenderFilter = (value: string) => {
    setFilters({ ...filters, genero: value || undefined })
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

  const handleCreateVoter = async (
    data: UserRegistrationFormType & { cityId?: string }
  ) => {
    const cityId = data.cityId ?? user?.cityId
    if (!cityId) throw new Error('Nenhuma cidade associada ao usuário')
    await createUser(data, cityId, 'voterCreation')
    setIsCreateModalOpen(false)
  }

  const handleEditVoter = async (
    data: UserRegistrationFormType & { cityId?: string }
  ) => {
    if (selectedUser) {
      const profileUpdates: Partial<UserProfile> = {
        nomeCompleto: data.nomeCompleto,
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
        estado: data.estado
      }
      await updateUser(selectedUser.id, profileUpdates)
      setIsEditModalOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    if (selectedUser) {
      await toggleUserStatus(selectedUser.id)
      setIsConfirmModalOpen(false)
    }
  }

  const handleDeleteVoter = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id)
      setIsDeleteModalOpen(false)
    }
  }

  const handleModalClose = (
    type: 'create' | 'edit' | 'view' | 'confirm' | 'delete'
  ) => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)
    if (type === 'confirm') setIsConfirmModalOpen(false)
    if (type === 'delete') setIsDeleteModalOpen(false)
    if (formRef.current) {
      formRef.current.reset()
      setCurrentStep(0)
    }
    setSelectedUser(null)
  }

  const handleModalOpen = (type: 'create' | 'edit') => {
    if (type === 'create') {
      setSelectedUser(null) // Garante que selectedUser seja null para criação
      setCurrentStep(0)
      setIsCreateModalOpen(true)
      if (formRef.current) {
        formRef.current.reset() // Reseta imediatamente para os defaultValues padrão
      }
    } else if (type === 'edit' && selectedUser) {
      setCurrentStep(0)
      setIsEditModalOpen(true)
      if (formRef.current) {
        const initialData = getInitialData(selectedUser)
        formRef.current.reset(initialData) // Reseta com os dados do eleitor
      }
    }
  }

  if (!user?.permissions.canRegisterVoters) {
    return (
      <div>
        Acesso restrito a usuários com permissão para cadastrar eleitores.
      </div>
    )
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.SearchWrapper>
            <Search
              placeholder="Pesquisar por nome ou CPF"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filtrar por gênero"
              options={[{ label: 'Todos', value: '' }, ...GENDER_OPTIONS]}
              onChange={handleGenderFilter}
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
              placeholder="Filtrar por cidade"
              options={CITY_FILTERED_OPTIONS}
              onChange={handleCityFilter}
              style={{ width: 200 }}
              disabled={user?.role !== UserRole.ADMINISTRADOR_GERAL}
            />
          </S.SearchWrapper>
          <Button type="primary" onClick={() => handleModalOpen('create')}>
            Novo Cadastro
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={voters}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        disabledRowKey={user?.id}
      />

      <Modal
        title="Criação de Novo Eleitor"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
      >
        {isCreateModalOpen && (
          <UserRegistrationForm
            onSubmit={handleCreateVoter}
            mode="voterCreation"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Eleitor"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
      >
        {isEditModalOpen && selectedUser && (
          <UserRegistrationForm
            onSubmit={handleEditVoter}
            mode="voterCreation"
            initialData={getInitialData(selectedUser)}
            userId={selectedUser.id}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Eleitor"
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
        title="Confirmação de Bloqueio"
        content="Deseja realmente bloquear este eleitor?"
        visible={isConfirmModalOpen}
        onConfirm={handleToggleStatus}
        onCancel={() => handleModalClose('confirm')}
      />

      <ConfirmModal
        type="danger"
        title="Confirmação de Exclusão"
        content="Deseja realmente excluir este eleitor? Esta ação é irreversível."
        visible={isDeleteModalOpen}
        onConfirm={handleDeleteVoter}
        onCancel={() => handleModalClose('delete')}
      />
    </View>
  )
}

export default CadastroEleitoresView
