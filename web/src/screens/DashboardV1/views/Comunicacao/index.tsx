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
  Form,
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

const { Option } = Select

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
  const [form] = Form.useForm()

  // Filtrar contatos permitidos com base nas regras de acesso
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
      // Marcar mensagens como lidas
      selectedTicket.messages?.forEach((msg) => {
        if (msg.senderId !== user.id && !msg.readBy?.includes(user.id)) {
          markMessageAsRead(selectedTicket.id, msg.id)
        }
      })
    }
  }, [selectedTicket, user])

  const handleCreateTicket = async (values: any) => {
    try {
      const ticketData: TicketRegistrationFormType = {
        title: values.title,
        description: values.description,
        participants: [user!.id, ...values.participants],
        initialMessage: values.initialMessage || '', // Mensagem inicial é opcional
        attachments: attachments.map((file) => ({ originFileObj: file } as any))
      }
      await createTicket(ticketData)
      setIsModalVisible(false)
      form.resetFields()
      setAttachments([])
    } catch (error) {
      console.error(error)
    }
  }

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
            >
              {Object.values(TicketStatus).map((status) => (
                <Option key={status} value={status}>
                  {getTicketStatusData(status).label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtrar por criador"
              allowClear
              onChange={(value) => setFilters({ ...filters, createdBy: value })}
              style={{ width: 200 }}
            >
              {allowedContacts.map((contact) => (
                <Option key={contact.id} value={contact.id}>
                  {contact.profile?.nomeCompleto} ({contact.role})
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filtrar por demanda relacionada"
              allowClear
              onChange={(value) =>
                setFilters({ ...filters, relatedDemandId: value })
              }
              style={{ width: 200 }}
            >
              {/* Supondo que você tenha uma lista de demandas disponíveis */}
              <Option value="demand1">Demanda 1</Option>
              <Option value="demand2">Demanda 2</Option>
            </Select>
            <Select
              placeholder="Filtrar por evento relacionado"
              allowClear
              onChange={(value) =>
                setFilters({ ...filters, relatedEventId: value })
              }
              style={{ width: 200 }}
            >
              {/* Supondo que você tenha uma lista de eventos disponíveis */}
              <Option value="event1">Evento 1</Option>
              <Option value="event2">Evento 2</Option>
            </Select>
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
            renderItem={(ticket) => (
              <List.Item
                onClick={() => setSelectedTicket(ticket)}
                style={{
                  cursor: 'pointer',
                  background:
                    selectedTicket?.id === ticket.id ? '#f0f0f0' : 'white'
                }}
              >
                <List.Item.Meta
                  title={ticket.title}
                  description={`Protocolo: ${ticket.protocol} | Status: ${
                    getTicketStatusData(ticket.status).label
                  }`}
                />
              </List.Item>
            )}
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
                >
                  {Object.values(TicketStatus).map((status) => (
                    <Option key={status} value={status}>
                      {getTicketStatusData(status).label}
                    </Option>
                  ))}
                </Select>
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
                {selectedTicket?.messages?.map((msg) => {
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
                })}
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
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreateTicket} layout="vertical">
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: 'Título é obrigatório' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Descrição"
            rules={[{ required: true, message: 'Descrição é obrigatória' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="participants"
            label="Participantes"
            rules={[
              {
                required: true,
                message: 'Selecione pelo menos um participante'
              }
            ]}
          >
            <Select mode="multiple" placeholder="Selecione os participantes">
              {allowedContacts.map((contact) => (
                <Option key={contact.id} value={contact.id}>
                  {contact.profile?.nomeCompleto} ({contact.role})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="initialMessage" label="Mensagem Inicial">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Anexos">
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
          </Form.Item>
        </Form>
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

// ===========================================================

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
