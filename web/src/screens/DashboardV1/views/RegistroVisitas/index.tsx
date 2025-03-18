// src/screens/DashboardV1/views/RegistroVisitasView.tsx

import { useState, useRef } from 'react'
import { Button, Input } from 'antd'
import { LuPlus, LuPen, LuTrash2, LuEye } from 'react-icons/lu'
import * as S from './styles'
import {
  View,
  Table,
  Modal,
  ConfirmModal,
  VisitRegistrationForm
} from '@/components'
import { useVisits } from '@/contexts/VisitsProvider'
import { Visit, VisitReason, VisitRegistrationFormType } from '@/@types/visit'
import { applyMask } from '@/utils/functions/masks'
import { TableExtrasWrapper } from '@/utils/styles/commons'
import { UseFormReturn } from 'react-hook-form'
import { useUsers } from '@/contexts/UsersProvider'
import { authService } from '@/services/auth'

const { Search } = Input

const RegistroVisitasView = () => {
  const { visits, loading, registerVisit, updateVisit, deleteVisit } =
    useVisits()
  const { voters, users } = useUsers()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [voterSearch, setVoterSearch] = useState('')
  const [allUsers, setAllUsers] = useState<any[]>([])
  const formRef = useRef<UseFormReturn<VisitRegistrationFormType> | null>(null)

  const fetchUsers = async (search: string) => {
    const snapshot = await authService.getUserData('')
    const fetchedUsers = snapshot ? Object.values(snapshot) : []
    const combinedUsers = [...voters, ...users, ...fetchedUsers]
    setAllUsers(
      combinedUsers.filter((user: any) =>
        user.nomeCompleto.toLowerCase().includes(search.toLowerCase())
      )
    )
  }

  const getVisitReasonLabel = (reason: string) => {
    return (
      Object.entries(VisitReason).find(([_, value]) => value === reason)?.[0] ||
      reason
    )
  }

  const columns = [
    {
      title: 'Eleitor',
      dataIndex: 'voterId',
      key: 'voterId',
      render: (id: string) =>
        allUsers.find((u) => u.id === id)?.nomeCompleto || id
    },
    {
      title: 'Data e Horário',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (text: string) =>
        applyMask(text.replace('T', ' ').replace('Z', ''), 'dateTime')
    },
    {
      title: 'Motivo',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => getVisitReasonLabel(reason)
    },
    {
      title: 'Vinculado a',
      dataIndex: 'relatedUserId',
      key: 'relatedUserId',
      render: (id: string) =>
        allUsers.find((u) => u.id === id)?.nomeCompleto || id
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Visit) => (
        <TableExtrasWrapper>
          <Button
            type="link"
            icon={<LuPen />}
            onClick={() => {
              setSelectedVisit(record)
              setIsEditModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuTrash2 />}
            danger
            onClick={() => {
              setSelectedVisit(record)
              setIsDeleteModalOpen(true)
            }}
          />
          <Button
            type="link"
            icon={<LuEye />}
            onClick={() => {
              setSelectedVisit(record)
              setIsViewModalOpen(true)
            }}
          />
        </TableExtrasWrapper>
      ),
      width: 150
    }
  ]

  const handleSearch = (value: string) => {
    setVoterSearch(value)
    fetchUsers(value)
  }

  const handleCreateVisit = async (data: VisitRegistrationFormType) => {
    await registerVisit(data)
    setIsCreateModalOpen(false)
  }

  const handleEditVisit = async (data: VisitRegistrationFormType) => {
    if (selectedVisit) {
      await updateVisit(selectedVisit.id, data)
      setIsEditModalOpen(false)
    }
  }

  const handleDeleteVisit = async () => {
    if (selectedVisit) {
      await deleteVisit(selectedVisit.id)
      setIsDeleteModalOpen(false)
    }
  }

  const handleModalClose = (type: 'create' | 'edit' | 'view' | 'delete') => {
    if (type === 'create') setIsCreateModalOpen(false)
    if (type === 'edit') setIsEditModalOpen(false)
    if (type === 'view') setIsViewModalOpen(false)
    if (type === 'delete') setIsDeleteModalOpen(false)
    if (formRef.current) formRef.current.reset()
    setSelectedVisit(null)
  }

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.SearchWrapper>
            <Search
              placeholder="Buscar eleitor"
              value={voterSearch}
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
          </S.SearchWrapper>
          <Button
            type="primary"
            icon={<LuPlus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Registrar Visita
          </Button>
        </S.HeaderWrapper>
      }
    >
      <Table
        columns={columns}
        dataSource={visits}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Nova Visita"
        open={isCreateModalOpen}
        onCancel={() => handleModalClose('create')}
        footer={null}
        size="default"
      >
        {isCreateModalOpen && (
          <VisitRegistrationForm
            onSubmit={handleCreateVisit}
            mode="create"
            ref={formRef}
          />
        )}
      </Modal>

      <Modal
        title="Editar Visita"
        open={isEditModalOpen}
        onCancel={() => handleModalClose('edit')}
        footer={null}
        size="default"
      >
        {isEditModalOpen && selectedVisit && (
          <VisitRegistrationForm
            onSubmit={handleEditVisit}
            mode="edit"
            initialData={{
              ...selectedVisit,
              dateTime: selectedVisit.dateTime
                .replace('T', ' ')
                .replace('Z', '')
            }}
            ref={formRef}
          />
        )}
      </Modal>

      <Modal
        title="Visualizar Visita"
        open={isViewModalOpen}
        onCancel={() => handleModalClose('view')}
        footer={null}
        size="default"
      >
        {isViewModalOpen && selectedVisit && (
          <VisitRegistrationForm
            mode="viewOnly"
            initialData={{
              ...selectedVisit,
              dateTime: selectedVisit.dateTime
                .replace('T', ' ')
                .replace('Z', '')
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        type="danger"
        title="Confirmação de Exclusão"
        content="Deseja realmente excluir esta visita? Esta ação é irreversível."
        visible={isDeleteModalOpen}
        onConfirm={handleDeleteVisit}
        onCancel={() => handleModalClose('delete')}
      />
    </View>
  )
}

export default RegistroVisitasView
