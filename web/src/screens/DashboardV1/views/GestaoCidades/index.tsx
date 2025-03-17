// src/screens/DashboardV1/views/GestaoCidades/index.tsx

import { useState, useRef } from 'react'
import * as S from './styles'
import { Button, Input, Tag, Avatar } from 'antd'
import { LuPen, LuTrash2, LuEye } from 'react-icons/lu'
import {
  View,
  Table,
  Modal,
  ConfirmModal,
  CityRegistrationForm
} from '@/components'
import { City, CityRegistrationFormType } from '@/@types/city'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { UseFormReturn } from 'react-hook-form'
import { StyledAvatar } from '@/utils/styles/antd'
import { useCities } from '@/contexts/CitiesProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { UserRole } from '@/@types/user'

const { Search } = Input

const GestaoCidadesView = () => {
  const { user } = useAuth()
  const {
    cities,
    loading,
    filters,
    setFilters,
    createCity,
    updateCity,
    deleteCity,
    getInitialData
  } = useCities()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const formRef = useRef<UseFormReturn<CityRegistrationFormType> | null>(null)

  const columns = [
    {
      title: 'Logo',
      key: 'logo',
      render: (_: any, record: City) => (
        <StyledAvatar size={32}>{record.name.charAt(0) || 'C'}</StyledAvatar>
      ),
      width: 65
    },
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: City, b: City) => a.name.localeCompare(b.name)
    },
    {
      title: 'Estado',
      dataIndex: 'state',
      key: 'state'
    },
    {
      title: 'Total de Usuários',
      key: 'totalUsers',
      render: (_: any, record: City) => (
        <Tag color="geekblue">{record.details.totalUsers ?? 0}</Tag>
      )
    },
    {
      title: 'Total de Eleitores',
      key: 'totalVoters',
      render: (_: any, record: City) => (
        <Tag color="green">{record.details.totalVoters ?? 0}</Tag>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: City) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedCity(record)
              setIsEditModalOpen(true)
              setCurrentStep(0)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedCity(record)
              setIsConfirmModalOpen(true)
            }}
            disabled={
              (record.details.totalUsers ?? 0) > 0 ||
              (record.details.totalVoters ?? 0) > 0
            }
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedCity(record)
              setIsViewModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      ),
      width: 150
    }
  ]

  const handleSearch = (value: string) => {
    setFilters({ ...filters, name: value })
  }

  const handleCreateCity = async (data: CityRegistrationFormType) => {
    await createCity(data)
    setIsCreateModalOpen(false)
  }

  const handleEditCity = async (data: CityRegistrationFormType) => {
    if (selectedCity) {
      const { name, state, ...editableData } = data
      await updateCity(selectedCity.id, editableData)
      setIsEditModalOpen(false)
    }
  }

  const handleDeleteCity = async () => {
    if (selectedCity) {
      await deleteCity(selectedCity.id)
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
    setSelectedCity(null)
  }

  if (user?.role !== UserRole.ADMINISTRADOR_GERAL) {
    return <div>Acesso restrito ao Administrador Geral.</div>
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.SearchWrapper>
            <Search
              placeholder="Pesquisar por nome da cidade"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
          </S.SearchWrapper>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Nova Cidade
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={cities}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Criação de Nova Cidade"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
      >
        {isCreateModalOpen && (
          <CityRegistrationForm
            onSubmit={handleCreateCity}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Cidade"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
      >
        {isEditModalOpen && selectedCity && (
          <CityRegistrationForm
            onSubmit={handleEditCity}
            mode="edit"
            initialData={getInitialData(selectedCity)}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Cidade"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
      >
        {isViewModalOpen && selectedCity && (
          <CityRegistrationForm
            mode="viewOnly"
            initialData={getInitialData(selectedCity)}
            currentStep={0}
            setCurrentStep={() => {}}
          />
        )}
      </Modal>

      <ConfirmModal
        type="warning"
        title="Confirmação de Exclusão"
        content={`Deseja excluir a cidade ${
          selectedCity?.name || 'selecionada'
        }?`}
        visible={isConfirmModalOpen}
        onConfirm={handleDeleteCity}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
    </View>
  )
}

export default GestaoCidadesView
