// src/screens/DashboardV1/views/CadastroEleitores/index.tsx

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
  UserProfile
} from '@/@types/user'
import { GENDER_OPTIONS, getGenderLabel } from '@/data/options'
import { applyMask } from '@/utils/functions/masks'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { useUsers } from '@/contexts/UsersProvider'
import { UseFormReturn } from 'react-hook-form'
import { StyledAvatar } from '@/utils/styles/antd'

const { Search } = Input

const CadastroEleitoresView = () => {
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
      dataIndex: ['profile', 'cidade'],
      key: 'cidade'
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
            disabled
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
      cpf: value
    })
  }

  const handleGenderFilter = (value: string) => {
    setFilters({ ...filters, genero: value || undefined })
  }

  const handleCreateVoter = async (data: UserRegistrationFormType) => {
    await createUser(data, 'default_city', 'voterCreation')
    setIsCreateModalOpen(false)
  }

  const handleEditVoter = async (data: UserRegistrationFormType) => {
    if (selectedUser) {
      // Filtra apenas os campos válidos para UserProfile
      const profileUpdates: Partial<UserProfile> = {
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
          </S.SearchWrapper>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
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
      />

      {/* Modal de Criação */}
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

      {/* Modal de Edição */}
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
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      {/* Modal de Visualização */}
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

      {/* Modal de Confirmação */}
      <ConfirmModal
        type="warning"
        title="Confirmação de Alteração de Status"
        content={`Deseja ${
          selectedUser?.status === 'ativo' ? 'bloquear' : 'desbloquear'
        } o eleitor ${selectedUser?.profile?.nomeCompleto || 'selecionado'}?`}
        visible={isConfirmModalOpen}
        onConfirm={handleToggleStatus}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

export default CadastroEleitoresView
