// src/screens/DashboardV1/views/SegmentacaoEleitores/index.tsx

import React, { useState, useRef, useEffect } from 'react'
import * as S from './styles'
import { LuPen, LuTrash2, LuEye, LuDownload } from 'react-icons/lu'
import { Button, Input, Select, Slider, Table, Card, Tabs, message } from 'antd'
import { Pie, Bar } from '@ant-design/charts'
import {
  View,
  Modal,
  ConfirmModal,
  SegmentRegistrationForm
} from '@/components'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { useSegments } from '@/contexts/SegmentsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import { useDemands } from '@/contexts/DemandsProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { Segment, SegmentRegistrationFormType } from '@/@types/segment'
import { DemandStatus, getDemandStatusData } from '@/@types/demand'
import { User, UserRole } from '@/@types/user'
import moment from 'moment'
import { UseFormReturn } from 'react-hook-form'
import { GENDER_OPTIONS } from '@/data/options'
// import { exportToExcel, exportToPDF } from '@/utils/functions/exportUtils'

const { Search } = Input
const { TabPane } = Tabs

const SegmentacaoEleitoresView = () => {
  const { user } = useAuth()
  const { voters, allUsers } = useUsers()
  const { demands } = useDemands()
  const { cities } = useCities()
  const {
    segments,
    filteredVoters,
    loading,
    filters,
    setFilters,
    createSegment,
    updateSegment,
    deleteSegment,
    applySegmentFilters
  } = useSegments()
  const [messageApi, contextHolder] = message.useMessage()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<SegmentRegistrationFormType> | null>(null)
  const formRef = useRef<UseFormReturn<SegmentRegistrationFormType> | null>(
    null
  )

  const bairroOptions = Array.from(
    new Set(voters.map((voter) => voter.profile?.bairro).filter(Boolean))
  ).map((bairro) => ({
    label: bairro,
    value: bairro
  }))

  const demandStatusOptions = Object.values(DemandStatus).map((status) => ({
    label: getDemandStatusData(status).label,
    value: status
  }))

  const cityOptions = cities.map((city) => ({
    label: city.name,
    value: city.id
  }))

  const genderData = GENDER_OPTIONS.map((gender) => ({
    type: gender.label,
    value: filteredVoters.filter(
      (voter) => voter.profile?.genero === gender.value
    ).length
  })).filter((data) => data.value > 0)

  const ageData = [
    { range: '18-25', count: 0 },
    { range: '26-35', count: 0 },
    { range: '36-45', count: 0 },
    { range: '46-55', count: 0 },
    { range: '56+', count: 0 }
  ]

  filteredVoters.forEach((voter) => {
    const birthDate = voter.profile?.dataNascimento
    if (birthDate) {
      const age = moment('2025-03-22').diff(moment(birthDate), 'years')
      if (age <= 25) ageData[0].count += 1
      else if (age <= 35) ageData[1].count += 1
      else if (age <= 45) ageData[2].count += 1
      else if (age <= 55) ageData[3].count += 1
      else ageData[4].count += 1
    }
  })

  const demandData = Object.values(DemandStatus)
    .map((status) => ({
      type: getDemandStatusData(status).label,
      value: demands.filter(
        (demand) =>
          demand.status === status &&
          filteredVoters.some((voter) => voter.id === demand.voterId)
      ).length
    }))
    .filter((data) => data.value > 0)

  const voterColumns = [
    {
      title: 'Nome',
      dataIndex: ['profile', 'nomeCompleto'],
      key: 'nomeCompleto'
    },
    {
      title: 'CPF',
      dataIndex: ['profile', 'cpf'],
      key: 'cpf'
    },
    {
      title: 'Bairro',
      dataIndex: ['profile', 'bairro'],
      key: 'bairro'
    },
    {
      title: 'Idade',
      key: 'idade',
      render: (record: User) => {
        const birthDate = record.profile?.dataNascimento
        return birthDate
          ? moment('2025-03-22').diff(moment(birthDate), 'years')
          : '-'
      }
    },
    {
      title: 'Última Demanda',
      key: 'ultimaDemanda',
      render: (record: User) => {
        const voterDemands = demands.filter(
          (demand) => demand.voterId === record.id
        )
        const lastDemand = voterDemands[voterDemands.length - 1]
        return lastDemand
          ? `${lastDemand.description} (${
              getDemandStatusData(lastDemand.status).label
            })`
          : '-'
      }
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: User) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            onClick={() => messageApi.info('Navegar para Histórico do Eleitor')}
          >
            Visualizar Perfil
          </Button>
        </TableExtrasWrapper>
      )
    }
  ]

  const segmentColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name'
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
      render: (_: any, record: Segment) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedSegment(record)
              setInitialEditData({
                name: record.name,
                bairro: record.filters.bairro,
                idadeMin: record.filters.idadeMin,
                idadeMax: record.filters.idadeMax,
                demandStatus: record.filters.demandStatus,
                cityId: record.cityId
              })
              setIsEditModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedSegment(record)
              setIsConfirmModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedSegment(record)
              setInitialEditData({
                name: record.name,
                bairro: record.filters.bairro,
                idadeMin: record.filters.idadeMin,
                idadeMax: record.filters.idadeMax,
                demandStatus: record.filters.demandStatus,
                cityId: record.cityId
              })
              setIsViewModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuDownload />}
            onClick={() => {
              applySegmentFilters(record)
              // exportToExcel(
              //   filteredVoters.map((voter) => ({
              //     Nome: voter.profile?.nomeCompleto,
              //     CPF: voter.profile?.cpf,
              //     Bairro: voter.profile?.bairro,
              //     Idade: voter.profile?.dataNascimento
              //       ? moment('2025-03-22').diff(
              //           moment(voter.profile.dataNascimento),
              //           'years'
              //         )
              //       : '-'
              //   })),
              //   `Segmento_${record.name}`
              // )
            }}
          />
          <Button type="link" onClick={() => applySegmentFilters(record)}>
            Aplicar Filtros
          </Button>
        </TableExtrasWrapper>
      )
    }
  ]

  const handleExport = (format: 'excel' | 'pdf') => {
    const data = filteredVoters.map((voter) => ({
      Nome: voter.profile?.nomeCompleto,
      CPF: voter.profile?.cpf,
      Bairro: voter.profile?.bairro,
      Idade: voter.profile?.dataNascimento
        ? moment('2025-03-22').diff(
            moment(voter.profile.dataNascimento),
            'years'
          )
        : '-'
    }))
    // if (format === 'excel') {
    //   exportToExcel(data, 'Segmentacao_Eleitores')
    // } else {
    //   exportToPDF(data, 'Segmentacao_Eleitores')
    // }
  }

  const handleCreateSegment = async (data: SegmentRegistrationFormType) => {
    await createSegment(data)
    handleModalClose('create')
  }

  const handleEditSegment = async (data: SegmentRegistrationFormType) => {
    if (selectedSegment) {
      await updateSegment(selectedSegment.id, data)
      handleModalClose('edit')
    }
  }

  const handleDeleteSegment = async () => {
    if (selectedSegment) {
      await deleteSegment(selectedSegment.id)
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
    setSelectedSegment(null)
    setInitialEditData(null)
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.HeaderTitle>Segmentação de Eleitores</S.HeaderTitle>
          <S.HeaderActions>
            {user?.role === UserRole.ADMINISTRADOR_GERAL && (
              <Select
                placeholder="Selecionar cidade"
                options={cityOptions}
                onChange={(value) => setFilters({ ...filters, cityId: value })}
                style={{ width: 200 }}
              />
            )}
            <Button onClick={() => handleExport('excel')}>
              Exportar Excel
            </Button>
            <Button onClick={() => handleExport('pdf')}>Exportar PDF</Button>
            <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
              Novo Segmento
            </Button>
          </S.HeaderActions>
        </S.HeaderWrapper>
      }
    >
      <S.SegmentacaoEleitoresView>
        <S.FiltersPanel>
          <h3>Filtros</h3>
          <Select
            placeholder="Filtrar por bairro"
            options={bairroOptions}
            onChange={(value) => setFilters({ ...filters, bairro: value })}
            style={{ width: '100%', marginBottom: 16 }}
            allowClear
          />
          <div style={{ marginBottom: 16 }}>
            <label>Faixa Etária</label>
            <Slider
              range
              min={18}
              max={100}
              defaultValue={[18, 100]}
              onChange={(value: number[]) =>
                setFilters({
                  ...filters,
                  idadeMin: value[0],
                  idadeMax: value[1]
                })
              }
            />
          </div>
          <Select
            mode="multiple"
            placeholder="Filtrar por status de demanda"
            options={demandStatusOptions}
            onChange={(value) =>
              setFilters({ ...filters, demandStatus: value })
            }
            style={{ width: '100%', marginBottom: 16 }}
            allowClear
          />
        </S.FiltersPanel>
        <S.MainContent>
          <S.SubmenuWrapper>
            {(user?.role === UserRole.ADMINISTRADOR_GERAL ||
              user?.role === UserRole.PREFEITO ||
              user?.role === UserRole.ADMINISTRADOR_CIDADE) && (
              <Button
                type={
                  filters.scope === 'cidadeCompleta' ? 'primary' : 'default'
                }
                onClick={() =>
                  setFilters({ ...filters, scope: 'cidadeCompleta' })
                }
              >
                Cidade Completa
              </Button>
            )}
            {user?.role === UserRole.VEREADOR && (
              <Button
                type={filters.scope === 'minhaBase' ? 'primary' : 'default'}
                onClick={() => setFilters({ ...filters, scope: 'minhaBase' })}
              >
                Minha Base
              </Button>
            )}
          </S.SubmenuWrapper>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Dados Demográficos" key="1">
              <S.ChartsWrapper>
                <Card title="Distribuição por Gênero">
                  <Pie
                    data={genderData}
                    angleField="value"
                    colorField="type"
                    label={{
                      type: 'inner',
                      offset: '-50%',
                      content: '{value}'
                    }}
                    interactions={[{ type: 'element-active' }]}
                  />
                </Card>
                <Card title="Faixa Etária">
                  <Bar
                    data={ageData}
                    xField="count"
                    yField="range"
                    label={{
                      position: 'middle',
                      layout: [{ type: 'adjust-color' }]
                    }}
                  />
                </Card>
                <Card title="Demandas por Status">
                  <Pie
                    data={demandData}
                    angleField="value"
                    colorField="type"
                    label={{
                      type: 'inner',
                      offset: '-50%',
                      content: '{value}'
                    }}
                    interactions={[{ type: 'element-active' }]}
                  />
                </Card>
              </S.ChartsWrapper>
              <S.VotersList>
                <h3>Lista Segmentada</h3>
                <Table
                  columns={voterColumns}
                  dataSource={filteredVoters}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </S.VotersList>
            </TabPane>
            <TabPane tab="Segmentos Criados" key="2">
              <Table
                columns={segmentColumns}
                dataSource={segments}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        </S.MainContent>
      </S.SegmentacaoEleitoresView>

      <Modal
        title="Criação de Novo Segmento"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isCreateModalOpen && (
          <SegmentRegistrationForm
            onSubmit={handleCreateSegment}
            mode="create"
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={loading}
          />
        )}
      </Modal>

      <Modal
        title="Edição de Segmento"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isEditModalOpen && selectedSegment && initialEditData && (
          <SegmentRegistrationForm
            onSubmit={handleEditSegment}
            mode="edit"
            initialData={initialEditData}
            ref={formRef}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            loading={loading}
          />
        )}
      </Modal>

      <Modal
        title="Visualização de Segmento"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
        destroyOnClose
      >
        {isViewModalOpen && selectedSegment && initialEditData && (
          <SegmentRegistrationForm
            mode="viewOnly"
            initialData={initialEditData}
            currentStep={0}
            setCurrentStep={() => {}}
          />
        )}
      </Modal>

      <ConfirmModal
        type="danger"
        title="Confirmação de Exclusão"
        content={`Deseja excluir o segmento ${selectedSegment?.name}? Essa ação não poderá ser desfeita.`}
        visible={isConfirmModalOpen}
        onConfirm={handleDeleteSegment}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Sim"
        cancelText="Não"
      />
      {contextHolder}
    </View>
  )
}

export default SegmentacaoEleitoresView
