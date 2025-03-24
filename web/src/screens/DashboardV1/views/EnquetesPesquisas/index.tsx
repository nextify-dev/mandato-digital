// src/screens/DashboardV1/views/EnquetesPesquisas/index.tsx

import React, { useState, useRef, useEffect } from 'react'
import * as S from './styles'
import {
  LuPen,
  LuTrash2,
  LuEye,
  LuCheck,
  LuX,
  LuMessageSquare
} from 'react-icons/lu'
import { Button, Select, message, Switch, Tabs, Empty } from 'antd'
import {
  View,
  Modal,
  ConfirmModal,
  PollRegistrationForm,
  PollResponseForm,
  Table
} from '@/components'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { usePolls } from '@/contexts/PollsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { useSegments } from '@/contexts/SegmentsProvider'
import {
  Poll,
  PollRegistrationFormType,
  PollResponse,
  PollResponseFormType
} from '@/@types/poll'
import { UserRole } from '@/@types/user'
import moment from 'moment'
import { UseFormReturn } from 'react-hook-form'
import { useUsers } from '@/contexts/UsersProvider'

const EnquetesPesquisasView = () => {
  const { user } = useAuth()
  const { getUserById } = useUsers()
  const { cities } = useCities()
  const { segments } = useSegments()
  const {
    polls,
    loading,
    createPoll,
    updatePoll,
    deletePoll,
    togglePollActive,
    submitResponse,
    getResponses
  } = usePolls()
  const [messageApi, contextHolder] = message.useMessage()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<PollRegistrationFormType> | null>(null)
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined)
  const [scopeFilter, setScopeFilter] = useState<
    'minhaBase' | 'cidadeCompleta'
  >('cidadeCompleta')
  const [selectedPollForResponses, setSelectedPollForResponses] = useState<
    string | null
  >(null)
  const [responses, setResponses] = useState<PollResponse[]>([])
  const formRef = useRef<UseFormReturn<PollRegistrationFormType> | null>(null)
  const responseFormRef = useRef<UseFormReturn<PollResponseFormType> | null>(
    null
  )

  const cityOptions = cities.map((city) => ({
    label: city.name,
    value: city.id
  }))

  const pollOptions = polls.map((poll) => ({
    label: poll.title,
    value: poll.id
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
      title: 'Respostas',
      dataIndex: 'responseCount',
      key: 'responseCount',
      render: (responseCount: number) => responseCount || 0
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
          <Button
            type="link"
            icon={<LuMessageSquare />}
            onClick={() => {
              setSelectedPoll(record)
              setIsRespondModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      )
    }
  ]

  const responseColumns = [
    {
      title: 'Usuário',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) =>
        getUserById(userId)?.profile?.nomeCompleto || '-'
    },
    {
      title: 'Enviado em',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (submittedAt: string) =>
        moment(submittedAt).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Respostas',
      dataIndex: 'answers',
      key: 'answers',
      render: (answers: PollResponse['answers']) => {
        const poll = polls.find((p) => p.id === selectedPollForResponses)
        if (!poll || !answers) return '-'
        return (
          <div>
            {answers.map((answer) => {
              const question = poll.questions.find(
                (q) => q.id === answer.questionId
              )
              return (
                <div key={answer.questionId}>
                  <strong>
                    {question?.title || 'Pergunta não encontrada'}:
                  </strong>{' '}
                  {answer.value}
                </div>
              )
            })}
          </div>
        )
      }
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

  const handleSubmitResponse = async (data: PollResponseFormType) => {
    if (selectedPoll) {
      await submitResponse(selectedPoll.id, data)
      handleModalClose('respond')
    }
  }

  const handleModalClose = (type: 'create' | 'edit' | 'view' | 'respond') => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)
    if (type === 'respond') setIsRespondModalOpen(false)

    if (formRef.current) {
      formRef.current.reset()
    }
    if (responseFormRef.current) {
      responseFormRef.current.reset()
    }
    setCurrentStep(0)
    setSelectedPoll(null)
    setInitialEditData(null)
  }

  const handlePollSelectForResponses = async (pollId: string) => {
    setSelectedPollForResponses(pollId)
    if (pollId) {
      const responsesData = await getResponses(pollId)
      setResponses(responsesData || [])
    } else {
      setResponses([])
    }
  }

  const tabItems = [
    {
      key: '1',
      label: 'Enquetes',
      children: (
        <Table
          columns={pollColumns}
          dataSource={filteredPolls}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: '2',
      label: 'Respostas',
      children: (
        <>
          <Select
            placeholder="Selecione uma enquete para visualizar respostas"
            options={pollOptions}
            onChange={handlePollSelectForResponses}
            value={selectedPollForResponses}
            style={{ width: 300, marginBottom: 20 }}
            allowClear
          />
          {selectedPollForResponses && responses.length > 0 ? (
            <Table
              columns={responseColumns}
              dataSource={responses}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="Nenhuma resposta encontrada para esta enquete." />
          )}
        </>
      )
    }
  ]

  return (
    <View
      header={
        <S.HeaderWrapper>
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
          </S.HeaderActions>
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Nova Enquete
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Tabs items={tabItems} defaultActiveKey="1" />

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

      <Modal
        title="Responder Enquete (Teste)"
        open={isRespondModalOpen}
        onCancel={() => handleModalClose('respond')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isRespondModalOpen && selectedPoll && (
          <PollResponseForm
            onSubmit={handleSubmitResponse}
            questions={selectedPoll.questions}
            ref={responseFormRef}
            loading={loading}
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
