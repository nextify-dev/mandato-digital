// src/screens/DashboardV1/views/Comunicacao/index.tsx

import React, { useState, useEffect } from 'react'
import * as S from './styles'
import {
  Button,
  Input,
  List,
  Avatar,
  Upload,
  Select,
  Tag,
  Modal as AntdModal
} from 'antd'
import { View, Modal } from '@/components'
import { useTickets } from '@/contexts/TicketsProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { useUsers } from '@/contexts/UsersProvider'
import {
  Ticket,
  TicketStatus,
  Message,
  getTicketStatusData,
  TicketRegistrationFormType
} from '@/@types/tickets'
import { UserRole, User, getRoleData } from '@/@types/user'
import { UploadOutlined, SendOutlined } from '@ant-design/icons'
import moment from 'moment'
import TicketRegistrationForm from '@/components/forms/TicketRegistrationForm'

interface IComunicacaoView {}

const ComunicacaoView = ({}: IComunicacaoView) => {
  const { user } = useAuth()
  const {
    tickets,
    loading,
    filters,
    setFilters,
    createTicket,
    sendMessage,
    markMessageAsRead,
    updateTicketStatus,
    deleteTicket
  } = useTickets()
  const { users, voters } = useUsers()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false)
  const [newStatus, setNewStatus] = useState<TicketStatus | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const allowedContacts = [...users, ...voters].filter((contact) => {
    if (!user) return false
    if (user.id === contact.id) return false
    if (user.role === UserRole.ADMINISTRADOR_GERAL) return true
    if (contact.cityId !== user.cityId) return false

    if (user.role === UserRole.ELEITOR) {
      return (
        (contact.role === UserRole.VEREADOR &&
          contact.id === user.vereadorId) ||
        (contact.role === UserRole.CABO_ELEITORAL &&
          contact.id === user.caboEleitoralId)
      )
    }
    if (user.role === UserRole.VEREADOR) {
      return (
        contact.role === UserRole.CABO_ELEITORAL ||
        (contact.role === UserRole.ELEITOR && contact.vereadorId === user.id)
      )
    }
    if (user.role === UserRole.CABO_ELEITORAL) {
      return (
        (contact.role === UserRole.VEREADOR &&
          contact.id === user.vereadorId) ||
        (contact.role === UserRole.ELEITOR &&
          contact.caboEleitoralId === user.id)
      )
    }
    return true
  })

  useEffect(() => {
    if (selectedTicket?.messages && user) {
      selectedTicket.messages.forEach((msg) => {
        if (msg.senderId !== user.id && !msg.readBy?.includes(user.id)) {
          markMessageAsRead(selectedTicket.id, msg.id)
        }
      })
    }
  }, [selectedTicket, user, markMessageAsRead])

  const handleDeleteTicket = async (ticketId: string) => {
    await deleteTicket(ticketId)
    setSelectedTicket(null)
  }

  const handleSendMessage = async () => {
    if (!selectedTicket || !messageContent.trim()) return
    try {
      await sendMessage(selectedTicket.id, messageContent, attachments)
      setMessageContent('')
      setAttachments([])
    } catch (error) {
      console.error(error)
    }
  }

  const handleStatusChange = (value: TicketStatus) => {
    setNewStatus(value)
    setIsStatusModalVisible(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedTicket || !newStatus) return
    try {
      await updateTicketStatus(selectedTicket.id, newStatus)
      setIsStatusModalVisible(false)
      setNewStatus(null)
    } catch (error) {
      console.error(error)
    }
  }

  const participants = selectedTicket
    ? selectedTicket.participants
        .map((participantId) =>
          [...users, ...voters].find((u) => u.id === participantId)
        )
        .filter((participant): participant is User => !!participant)
    : []

  const getTimeSinceLastMessage = (ticket: Ticket): string => {
    if (!ticket.messages || ticket.messages.length === 0) {
      return 'Sem mensagens'
    }
    const lastMessage = ticket.messages[ticket.messages.length - 1]
    return moment(lastMessage.timestamp).fromNow()
  }

  const STATUS_OPTIONS = Object.values(TicketStatus).map((status) => ({
    label: getTicketStatusData(status).label,
    value: status
  }))

  const CREATOR_OPTIONS = allowedContacts.map((contact) => ({
    label: `${contact.profile?.nomeCompleto} (${contact.role})`,
    value: contact.id
  }))

  return (
    <View
      header={
        <S.Header>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Select
              placeholder="Filtrar por status"
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: 200 }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="Filtrar por criador"
              allowClear
              onChange={(value) => setFilters({ ...filters, createdBy: value })}
              style={{ width: 200 }}
              options={CREATOR_OPTIONS}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Novo Ticket
          </Button>
        </S.Header>
      }
    >
      <S.ComunicacaoView>
        <S.TicketList>
          <List
            loading={loading}
            dataSource={tickets}
            renderItem={(ticket) => {
              const ticketParticipants = ticket.participants
                .map((participantId) =>
                  [...users, ...voters].find((u) => u.id === participantId)
                )
                .filter((participant): participant is User => !!participant)
              const lastMessage =
                ticket.messages && ticket.messages.length > 0
                  ? ticket.messages[ticket.messages.length - 1]
                  : null
              return (
                <List.Item
                  onClick={() => setSelectedTicket(ticket)}
                  style={{
                    cursor: 'pointer',
                    background:
                      selectedTicket?.id === ticket.id ? '#f0f0f0' : 'white',
                    padding: '10px'
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{ticket.title.charAt(0)}</Avatar>}
                    title={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{ticket.title}</span>
                        <Tag color={getTicketStatusData(ticket.status).color}>
                          {getTicketStatusData(ticket.status).label}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>Protocolo: {ticket.protocol}</div>
                        <div>
                          Participantes:{' '}
                          {ticketParticipants
                            .map((p) => p.profile?.nomeCompleto)
                            .join(', ')}
                        </div>
                        {lastMessage && (
                          <div>
                            Última mensagem: {lastMessage.content.slice(0, 50)}
                            {lastMessage.content.length > 50 ? '...' : ''}
                          </div>
                        )}
                        <div style={{ color: '#888', fontSize: '12px' }}>
                          {getTimeSinceLastMessage(ticket)}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </S.TicketList>
        <S.ChatWindow>
          {selectedTicket ? (
            <>
              <S.ChatHeader>
                <h3>{selectedTicket.title}</h3>
                <p>Protocolo: {selectedTicket.protocol}</p>
                <div style={{ marginTop: '10px' }}>
                  <strong>Participantes: </strong>
                  {participants.map((participant) => {
                    const roleData = getRoleData(participant.role)
                    return (
                      <Tag key={participant.id} color={roleData.color}>
                        {participant.profile?.nomeCompleto} ({roleData.label})
                      </Tag>
                    )
                  })}
                </div>
                <Select
                  loading={loading}
                  disabled={loading}
                  value={selectedTicket.status}
                  onChange={handleStatusChange}
                  style={{ width: 200, marginTop: '10px' }}
                  options={STATUS_OPTIONS}
                />
                {user?.role === UserRole.ADMINISTRADOR_GERAL && (
                  <Button
                    loading={loading}
                    disabled={loading}
                    danger
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                  >
                    Deletar Ticket
                  </Button>
                )}
              </S.ChatHeader>
              <S.MessagesArea>
                {Array.isArray(selectedTicket.messages) &&
                selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg) => {
                    const sender = [...users, ...voters].find(
                      (u) => u.id === msg.senderId
                    )
                    const isOwnMessage = msg.senderId === user?.id
                    return (
                      <MessageComponent
                        key={msg.id}
                        msg={msg}
                        sender={sender}
                        isOwnMessage={isOwnMessage}
                      />
                    )
                  })
                ) : (
                  <div>Nenhuma mensagem disponível</div>
                )}
              </S.MessagesArea>
              <S.MessageInputArea>
                <Input.TextArea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={3}
                />
                <Upload
                  fileList={attachments.map((file, index) => ({
                    uid: String(index),
                    name: file.name,
                    status: 'done'
                  }))}
                  beforeUpload={(file) => {
                    setAttachments([...attachments, file])
                    return false
                  }}
                  onRemove={(file) => {
                    setAttachments(
                      attachments.filter((_, i) => String(i) !== file.uid)
                    )
                  }}
                >
                  <Button icon={<UploadOutlined />}>Anexar</Button>
                </Upload>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                >
                  Enviar
                </Button>
              </S.MessageInputArea>
            </>
          ) : (
            <div>Selecione um ticket para visualizar as mensagens</div>
          )}
        </S.ChatWindow>
      </S.ComunicacaoView>

      <Modal
        title="Novo Ticket"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <TicketRegistrationForm
          onSubmit={async (data) => {
            try {
              await createTicket(data)
              setIsModalVisible(false)
              setCurrentStep(0)
            } catch (error) {
              console.error(error)
            }
          }}
          mode="create"
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          allowedContacts={allowedContacts}
        />
      </Modal>

      <AntdModal
        title="Confirmar Alteração de Status"
        open={isStatusModalVisible}
        onOk={confirmStatusChange}
        onCancel={() => setIsStatusModalVisible(false)}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <p>
          Deseja alterar o status do ticket para{' '}
          <strong>
            {newStatus ? getTicketStatusData(newStatus).label : ''}
          </strong>
          ?
        </p>
      </AntdModal>
    </View>
  )
}

export default ComunicacaoView

export interface IMessageComponent {
  msg: Message
  sender?: User
  isOwnMessage: boolean
}

const MessageComponent = ({ msg, sender, isOwnMessage }: IMessageComponent) => {
  return (
    <S.MessageContainer own={isOwnMessage ? 1 : 0} key={msg.id}>
      <Avatar>{sender?.profile?.nomeCompleto?.charAt(0) || 'U'}</Avatar>
      <S.MessageContent own={isOwnMessage ? 1 : 0}>
        <div>{msg.content}</div>
        <small>{moment(msg.timestamp).format('DD/MM/YYYY HH:mm')}</small>
        {msg.attachments && (
          <div>
            {msg.attachments.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Anexo {index + 1}
              </a>
            ))}
          </div>
        )}
      </S.MessageContent>
    </S.MessageContainer>
  )
}
