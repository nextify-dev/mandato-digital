// src/screens/DashboardV1/views/CadastroEleitores/index.tsx

import { useState } from 'react'

import * as S from './styles'

import { Button, Input, Select, Tag, Avatar, Space } from 'antd'
import { LuPenTool, LuTrash2, LuLock, LuLockOpen, LuEye } from 'react-icons/lu'

import { View, Table, Modal, UserRegistrationForm } from '@/components'
import { VotersProvider, useVoters } from '@/contexts/VotersProvider'
import { getStatusData, User, UserRegistrationFormType } from '@/@types/user'
import { GENDER_OPTIONS, getGenderLabel } from '@/data/options'
import { applyMask, convertToISODate } from '@/utils/functions/masks'
import { TableExtrasWrapper } from '@/utils/styles/commons'

const { Search } = Input

const CadastroEleitoresViewContent = () => {
  const {
    voters,
    loading,
    filters,
    setFilters,
    createVoter,
    toggleVoterStatus,
    deleteVoter
  } = useVoters()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const columns = [
    {
      title: 'Foto',
      key: 'foto',
      render: (_: any, record: User) => (
        <Avatar src={record.profile?.foto} size={32}>
          {record.profile?.nomeCompleto?.charAt(0) || 'E'}
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
      dataIndex: ['profile', 'status'],
      key: 'idade',
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
            icon={<LuPenTool />}
            onClick={() => console.log('Editar', record.id)}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => deleteVoter(record.id)}
            disabled
          />
          <Button
            type="link"
            icon={record.status === 'ativo' ? <LuLock /> : <LuLockOpen />}
            onClick={() => toggleVoterStatus(record.id)}
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
      cpf: value
    })
  }

  const handleGenderFilter = (value: string) => {
    setFilters({ ...filters, genero: value || undefined })
  }

  const handleCreateVoter = async (data: UserRegistrationFormType) => {
    await createVoter(data, 'default_city') // Substitua 'default_city' por um valor dinâmico, se necessário
    setIsModalOpen(false)
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
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
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
      <Modal
        title="Novo Cadastro de Eleitor"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <UserRegistrationForm
          onSubmit={handleCreateVoter}
          mode="voterCreation"
        />
      </Modal>
    </View>
  )
}

const CadastroEleitoresView = () => (
  <VotersProvider>
    <CadastroEleitoresViewContent />
  </VotersProvider>
)

export default CadastroEleitoresView
