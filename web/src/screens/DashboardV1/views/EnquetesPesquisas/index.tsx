// src/screens/DashboardV1/views/EnquetesPesquisas/index.tsx

import React, { useState, useRef } from 'react'
import * as S from './styles'
import { LuPen, LuTrash2, LuEye, LuCheck, LuX } from 'react-icons/lu'
import { Button, Select, Table, message, Switch } from 'antd'
import { View, Modal, ConfirmModal, PollRegistrationForm } from '@/components'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { usePolls } from '@/contexts/PollsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { useSegments } from '@/contexts/SegmentsProvider'
import { Poll, PollRegistrationFormType } from '@/@types/poll'
import { UserRole } from '@/@types/user'
import moment from 'moment'
import { UseFormReturn } from 'react-hook-form'

const EnquetesPesquisasView = () => {
  const { user } = useAuth()
  const { cities } = useCities()
  const { segments } = useSegments()
  const {
    polls,
    loading,
    createPoll,
    updatePoll,
    deletePoll,
    togglePollActive
  } = usePolls()
  const [messageApi, contextHolder] = message.useMessage()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<PollRegistrationFormType> | null>(null)
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined)
  const [scopeFilter, setScopeFilter] = useState<
    'minhaBase' | 'cidadeCompleta'
  >('cidadeCompleta')
  const formRef = useRef<UseFormReturn<PollRegistrationFormType> | null>(null)

  const cityOptions = cities.map((city) => ({
    label: city.name,
    value: city.id
  }))

  const filteredPolls = polls.filter((poll) => {
    let matchesCity = true
    let matchesScope = true

    if (cityFilter) {
      matchesCity = poll.cityIds.includes(cityFilter)
    }

    if (user?.role === UserRole.VEREADOR && scopeFilter === 'minhaBase') {
      matchesScope = poll.createdBy === user.id
    }

    return matchesCity && matchesScope
  })

  const pollColumns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Segmento',
      dataIndex: 'segmentId',
      key: 'segmentId',
      render: (segmentId: string) =>
        segments.find((s) => s.id === segmentId)?.name || '-'
    },
    {
      title: 'Cidades',
      dataIndex: 'cityIds',
      key: 'cityIds',
      render: (cityIds: string[]) =>
        cityIds
          .map((id) => cities.find((city) => city.id === id)?.name)
          .join(', ') || '-'
    },
    {
      title: 'Perguntas',
      dataIndex: 'questions',
      key: 'questions',
      render: (questions: PollRegistrationFormType['questions']) =>
        questions.length
    },
    {
      title: 'Ativo',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Poll) => (
        <Switch
          checked={isActive}
          onChange={(checked) => togglePollActive(record.id, checked)}
          checkedChildren={<LuCheck />}
          unCheckedChildren={<LuX />}
        />
      )
    },
    {
      title: 'Criado em',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) =>
        moment(createdAt).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Poll) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedPoll(record)
              setInitialEditData({
                title: record.title,
                description: record.description,
                segmentId: record.segmentId,
                questions: record.questions,
                cityIds: record.cityIds,
                isActive: record.isActive
              })
              setIsEditModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedPoll(record)
              setIsConfirmModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedPoll(record)
              setInitialEditData({
                title: record.title,
                description: record.description,
                segmentId: record.segmentId,
                questions: record.questions,
                cityIds: record.cityIds,
                isActive: record.isActive
              })
              setIsViewModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      )
    }
  ]

  const handleCreatePoll = async (data: PollRegistrationFormType) => {
    const selectedSegment = segments.find((s) => s.id === data.segmentId)
    if (!selectedSegment) {
      messageApi.error('Segmento não encontrado.')
      return
    }
    await createPoll(data, selectedSegment)
    handleModalClose('create')
  }

  const handleEditPoll = async (data: PollRegistrationFormType) => {
    if (selectedPoll) {
      await updatePoll(selectedPoll.id, data)
      handleModalClose('edit')
    }
  }

  const handleDeletePoll = async () => {
    if (selectedPoll) {
      await deletePoll(selectedPoll.id)
      setIsConfirmModalOpen(false)
    }
  }

  const handleModalClose = (type: 'create' | 'edit' | 'view') => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)

    if (formRef.current) {
      formRef.current.reset()
    }
    setCurrentStep(0)
    setSelectedPoll(null)
    setInitialEditData(null)
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.HeaderTitle>Enquetes e Pesquisas</S.HeaderTitle>
          <S.HeaderActions>
            {user?.role === UserRole.ADMINISTRADOR_GERAL && (
              <Select
                placeholder="Selecionar cidade"
                options={cityOptions}
                onChange={(value) => setCityFilter(value)}
                value={cityFilter}
                style={{ width: 200 }}
                allowClear
              />
            )}
            {user?.role === UserRole.VEREADOR && (
              <Select
                options={[
                  { label: 'Cidade Completa', value: 'cidadeCompleta' },
                  { label: 'Minha Base', value: 'minhaBase' }
                ]}
                onChange={(value) => setScopeFilter(value)}
                value={scopeFilter}
                style={{ width: 200 }}
              />
            )}
            <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
              Nova Enquete
            </Button>
          </S.HeaderActions>
        </S.HeaderWrapper>
      }
    >
      <S.EnquetesPesquisasView>
        <Table
          columns={pollColumns}
          dataSource={filteredPolls}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </S.EnquetesPesquisasView>

      <Modal
        title="Criação de Nova Enquete"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isCreateModalOpen && (
          <PollRegistrationForm
            onSubmit={handleCreatePoll}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={loading}
            segments={segments}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Enquete"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isEditModalOpen && selectedPoll && initialEditData && (
          <PollRegistrationForm
            onSubmit={handleEditPoll}
            mode="edit"
            initialData={initialEditData}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={loading}
            segments={segments}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Enquete"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isViewModalOpen && selectedPoll && initialEditData && (
          <PollRegistrationForm
            mode="viewOnly"
            initialData={initialEditData}
            currentStep={0}
            setCurrentStep={() => {}}
            segments={segments}
          />
        )}
      </Modal>

      <ConfirmModal
        type="danger"
        title="Confirmação de Exclusão"
        content={`Deseja excluir a enquete ${selectedPoll?.title}? Essa ação não poderá ser desfeita.`}
        visible={isConfirmModalOpen}
        onConfirm={handleDeletePoll}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
      {contextHolder}
    </View>
  )
}

export default EnquetesPesquisasView
