// src/screens/DashboardV1/views/SegmentacaoEleitores/index.tsx

import React, { useState, useRef } from 'react'
import * as S from './styles'
import { LuPen, LuTrash2, LuEye } from 'react-icons/lu'
import { Button, Select, message } from 'antd'
import {
  View,
  Modal,
  Table,
  ConfirmModal,
  SegmentRegistrationForm
} from '@/components'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { useSegments } from '@/contexts/SegmentsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { Segment, SegmentRegistrationFormType } from '@/@types/segment'
import { DemandStatus, getDemandStatusData } from '@/@types/demand'
import { UserRole } from '@/@types/user'
import moment from 'moment'
import { UseFormReturn } from 'react-hook-form'

const SegmentacaoEleitoresView = () => {
  const { user } = useAuth()
  const { cities } = useCities()
  const { segments, loading, createSegment, updateSegment, deleteSegment } =
    useSegments()
  const [messageApi, contextHolder] = message.useMessage()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initialEditData, setInitialEditData] =
    useState<Partial<SegmentRegistrationFormType> | null>(null)
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined)
  const [scopeFilter, setScopeFilter] = useState<
    'minhaBase' | 'cidadeCompleta'
  >('cidadeCompleta')
  const formRef = useRef<UseFormReturn<SegmentRegistrationFormType> | null>(
    null
  )

  const cityOptions = cities.map((city) => ({
    label: city.name,
    value: city.id
  }))

  const filteredSegments = segments.filter((segment) => {
    let matchesCity = true
    let matchesScope = true

    if (cityFilter) {
      matchesCity = segment.cityId === cityFilter
    }

    if (user?.role === UserRole.VEREADOR && scopeFilter === 'minhaBase') {
      matchesScope = segment.createdBy === user.id
    }

    return matchesCity && matchesScope
  })

  const segmentColumns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Cidade',
      dataIndex: 'cityId',
      key: 'cityId',
      render: (cityId: string) =>
        cities.find((city) => city.id === cityId)?.name || '-'
    },
    {
      title: 'Bairro',
      dataIndex: ['filters', 'bairro'],
      key: 'bairro',
      render: (bairro: string) => bairro || '-'
    },
    {
      title: 'Faixa Etária',
      key: 'faixaEtaria',
      render: (record: Segment) => {
        const { idadeMin, idadeMax } = record.filters
        if (idadeMin && idadeMax) {
          return `${idadeMin} - ${idadeMax} anos`
        }
        return '-'
      }
    },
    {
      title: 'Status das Demandas',
      dataIndex: ['filters', 'demandStatus'],
      key: 'demandStatus',
      render: (demandStatus: DemandStatus[]) =>
        demandStatus && demandStatus.length > 0
          ? demandStatus
              .map((status) => getDemandStatusData(status).label)
              .join(', ')
          : '-'
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
        </TableExtrasWrapper>
      )
    }
  ]

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
            Novo Segmento
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={segmentColumns}
        dataSource={filteredSegments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

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
