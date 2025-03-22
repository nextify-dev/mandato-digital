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

import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'
import formatUsername from '@/utils/functions/formatUsername'
import { StyledTooltip } from '@/utils/styles/antd'

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

  // Função auxiliar para converter mensagens de objeto para array
  const convertMessagesToArray = (
    messagesObj: Record<string, Message> | null | undefined
  ): Message[] => {
    if (!messagesObj) return []
    return Object.keys(messagesObj).map((key) => ({
      ...messagesObj[key],
      id: key
    }))
  }

  // Novo useEffect para escutar mudanças no ticket ativo
  useEffect(() => {
    if (!selectedTicket) return

    const ticketRef = ref(db, `tickets/${selectedTicket.id}`)
    const listener = onValue(
      ticketRef,
      (snapshot) => {
        const updatedTicket = snapshot.val() as Ticket | null
        if (updatedTicket) {
          setSelectedTicket({
            ...updatedTicket,
            messages: convertMessagesToArray(updatedTicket.messages as any)
          })
        } else {
          // Se o ticket foi deletado, podemos desmarcá-lo
          setSelectedTicket(null)
        }
      },
      (error) => {
        console.error('Erro ao escutar mudanças no ticket:', error)
      }
    )

    // Cleanup: remove o listener quando o ticket mudar ou o componente for desmontado
    return () => {
      off(ticketRef, 'value', listener)
    }
  }, [selectedTicket?.id])

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

  const STATUS_OPTIONS = Object.values(TicketStatus).map((status) => ({
    label: getTicketStatusData(status).label,
    value: status
  }))

  const CREATOR_OPTIONS = user
    ? [
        ...(allowedContacts.some((contact) => contact.id === user.id)
          ? []
          : [user]),
        ...allowedContacts
      ].map((contact) => ({
        label: `${formatUsername(contact.profile?.nomeCompleto).reducedName} (${
          getRoleData(contact.role).label
        })`,
        value: contact.id
      }))
    : allowedContacts.map((contact) => ({
        label: `${formatUsername(contact.profile?.nomeCompleto).reducedName} (${
          getRoleData(contact.role).label
        })`,
        value: contact.id
      }))

  return (
    <View
      header={
        <S.HeaderWrapper>
          <S.TicketFilters>
            <Select
              placeholder="Filtrar por status"
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: 140 }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder="Filtrar por criador"
              allowClear
              onChange={(value) => setFilters({ ...filters, createdBy: value })}
              style={{ width: 220 }}
              options={CREATOR_OPTIONS}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </S.TicketFilters>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Novo Ticket
          </Button>
        </S.HeaderWrapper>
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
                <TicketCard
                  ticket={ticket}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  ticketParticipants={ticketParticipants}
                  lastMessage={lastMessage}
                />
              )
            }}
          />
        </S.TicketList>
        <Chat
          selectedTicket={selectedTicket}
          user={user}
          participants={participants}
          messageContent={messageContent}
          attachments={attachments}
          loading={loading}
          statusOptions={STATUS_OPTIONS}
          setMessageContent={setMessageContent}
          setAttachments={setAttachments}
          handleSendMessage={handleSendMessage}
          handleStatusChange={handleStatusChange}
          handleDeleteTicket={handleDeleteTicket}
        />
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

// =================================================== MESSAGE COMPONENT

export interface IMessageComponent {
  msg: Message
  sender?: User
  isOwnMessage: boolean
}

const MessageComponent = ({ msg, sender, isOwnMessage }: IMessageComponent) => {
  return (
    <S.MessageContainer own={isOwnMessage ? 1 : 0} key={msg.id}>
      <S.MessageAvatar>
        {formatUsername(sender?.profile?.nomeCompleto).initials || ''}
      </S.MessageAvatar>
      <S.MessageContent own={isOwnMessage ? 1 : 0}>
        <S.MessageContentText>{msg.content}</S.MessageContentText>
        <S.MessageContentDate>
          {moment(msg.timestamp).format('DD/MM/YYYY HH:mm')}
        </S.MessageContentDate>
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

// =================================================== TICKET CARD

export interface ITicketCard {
  ticket: Ticket
  selectedTicket: Ticket | null
  setSelectedTicket: (ticket: Ticket) => void
  ticketParticipants: User[]
  lastMessage: Message | null
}

const TicketCard = ({
  ticket,
  selectedTicket,
  setSelectedTicket,
  ticketParticipants,
  lastMessage
}: ITicketCard) => {
  const getTimeSinceLastMessage = (ticket: Ticket): string => {
    if (!ticket.messages || ticket.messages.length === 0) {
      return 'Sem mensagens'
    }
    const lastMessage = ticket.messages[ticket.messages.length - 1]
    return moment(lastMessage.timestamp).fromNow()
  }

  return (
    <S.TicketItem
      onClick={() => setSelectedTicket(ticket)}
      active={selectedTicket?.id === ticket.id ? 1 : 0}
      color={getTicketStatusData(ticket.status).color}
    >
      <List.Item.Meta
        title={
          <S.TicketItemHeader>
            <S.TicketItemTitle>
              <h3>{ticket.title}</h3>
              <span>{ticket.protocol}</span>
            </S.TicketItemTitle>
            <S.TicketItemTag color={getTicketStatusData(ticket.status).color}>
              {getTicketStatusData(ticket.status).label}
            </S.TicketItemTag>
          </S.TicketItemHeader>
        }
        description={
          <S.TicketItemDescriptions>
            <p>
              {ticketParticipants
                .map((p) => formatUsername(p.profile?.nomeCompleto).firstName)
                .join(', ')}
            </p>

            {lastMessage && (
              <S.TicketItemDescriptionSince>
                Última mensagem há: <b>{getTimeSinceLastMessage(ticket)}</b>
              </S.TicketItemDescriptionSince>
            )}
          </S.TicketItemDescriptions>
        }
      />
    </S.TicketItem>
  )
}

// =================================================== CHAT
interface IChat {
  selectedTicket: Ticket | null
  user: User | null
  participants: User[]
  messageContent: string
  attachments: File[]
  loading: boolean
  statusOptions: { label: string; value: TicketStatus }[]
  setMessageContent: (content: string) => void
  setAttachments: (files: File[]) => void
  handleSendMessage: () => Promise<void>
  handleStatusChange: (value: TicketStatus) => void
  handleDeleteTicket: (ticketId: string) => Promise<void>
}

const Chat = ({
  selectedTicket,
  user,
  participants,
  messageContent,
  attachments,
  loading,
  statusOptions,
  setMessageContent,
  setAttachments,
  handleSendMessage,
  handleStatusChange,
  handleDeleteTicket
}: IChat) => {
  return (
    <S.ChatWindow>
      {selectedTicket ? (
        <>
          <S.ChatHeader>
            <S.ChatHeaderContent>
              <S.ChatTicketTitle>{selectedTicket.title}</S.ChatTicketTitle>
              <S.ChatTicketProtocol>
                <b>Protocolo:</b> {selectedTicket.protocol}
              </S.ChatTicketProtocol>
              <S.ChatTicketParticipants>
                <b>Participantes:</b>
                <S.ChatTicketParticipantsWrapper>
                  {participants.map((participant) => {
                    const roleData = getRoleData(participant.role)
                    return (
                      <StyledTooltip
                        key={`tooltip-${participant.id}`}
                        placement="bottomRight"
                        title={roleData.label}
                        arrow
                      >
                        <S.ParticipantTag
                          key={participant.id}
                          color={roleData.color}
                        >
                          {participant.profile?.nomeCompleto}
                        </S.ParticipantTag>
                      </StyledTooltip>
                    )
                  })}
                </S.ChatTicketParticipantsWrapper>
              </S.ChatTicketParticipants>
            </S.ChatHeaderContent>
            <S.ChatHeaderMenu>
              {user?.role !== UserRole.ELEITOR && (
                <Select
                  loading={loading}
                  disabled={loading}
                  value={selectedTicket.status}
                  onChange={handleStatusChange}
                  options={statusOptions}
                />
              )}
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
            </S.ChatHeaderMenu>
          </S.ChatHeader>
          <S.MessagesArea>
            {Array.isArray(selectedTicket.messages) &&
            selectedTicket.messages.length > 0 ? (
              selectedTicket.messages.map((msg) => {
                const sender = participants.find((u) => u.id === msg.senderId)
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
              rows={1}
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
              <Button icon={<UploadOutlined />} />
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
        <S.EmptyChat>
          Selecione um ticket para visualizar as mensagens
        </S.EmptyChat>
      )}
    </S.ChatWindow>
  )
}
