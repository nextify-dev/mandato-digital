// src/screens/DashboardV1/views/Comunicacao/styles.ts

import { color, textColor } from '@/utils/styles/colors'
import { fontHeight, fontSize, fontWeight } from '@/utils/styles/fonts'
import { Globals } from '@/utils/styles/globals'
import { Avatar, List, Tag } from 'antd'
import styled from 'styled-components'

const ticketsListWidth = Globals.chat.sidebar.width.expanded
const ticketsChatWidth = `calc(100% - ${Globals.chat.sidebar.width.expanded})`

export const ComunicacaoView = styled.div`
  display: flex;
  height: calc(100vh - 195px);
  border-radius: 8px;
  overflow: hidden;

  border: 1px solid ${color('colorBorderSecondary')};
`

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
`

export const TicketFilters = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

// ========================================= TICKET LIST & TICKET ITEM

export const TicketList = styled.div`
  width: ${ticketsListWidth};
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
`

export const TicketItem = styled(List.Item)<{ active: number; color: string }>`
  display: flex;
  cursor: pointer;
  padding: 18px 14px !important;

  background-color: ${({ active }) => (active ? '#f0f0f0' : 'white')};
  border-left: 4px solid ${({ color }) => color};
`

export const TicketItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`

export const TicketItemTitle = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 4px;

  h3 {
    ${fontSize('xs')}
    ${fontHeight('xs')}
    ${fontWeight('medium')}
  }

  span {
    ${fontSize('xxxs')}
    ${fontHeight('xxxs')}
    ${fontWeight('light')}

    ${textColor('colorTextSecondary')}
  }
`

export const TicketItemTag = styled(Tag)`
  height: fit-content;
  padding: 4px 6px;
  margin: 0;

  ${fontSize('ss')}
  ${fontHeight('ss')}
  ${fontWeight('medium')}
`

export const TicketItemDescriptions = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 5px;

  p {
    display: flex;
    flex-direction: column;
    row-gap: 2px;

    ${fontSize('xxs')}
    ${fontHeight('small')}
    ${fontWeight('medium')}
    
    ${textColor('colorTextSecondary')}
  }
`

export const TicketItemDescriptionSince = styled.div`
  ${fontSize('ss')}
  ${fontHeight('ss')}
  ${fontWeight('regular')}

	b {
    ${fontWeight('bold')}
  }
`

// ========================================= CHAT

export const ChatWindow = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  width: ${ticketsChatWidth};
`

export const ChatHeader = styled.div`
  display: flex;
  padding: 16px 14px;

  border-bottom: 1px solid #e8e8e8;
`

export const ChatHeaderContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  row-gap: 5px;
`

export const ChatTicketTitle = styled.div`
  ${fontSize('regular')}
  ${fontHeight('regular')}
  ${fontWeight('bold')}
`

export const ChatTicketProtocol = styled.p`
  ${fontSize('xxxs')}
  ${fontHeight('xxxs')}
  ${fontWeight('regular')}

	b {
    ${fontWeight('bold')}
  }
`

export const ChatTicketParticipants = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 4px;
  margin-top: 6px;

  b {
    ${fontSize('xxxs')}
    ${fontHeight('xxxs')}
    ${fontWeight('bold')}
  }
`

export const ChatTicketParticipantsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`

export const ParticipantTag = styled(Tag)`
  height: fit-content;
  padding: 3px 5px;
  margin: 0;

  ${fontSize('ss')}
  ${fontHeight('ss')}
  ${fontWeight('medium')}
`

export const ChatHeaderMenu = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 6px;
  width: 140px;
`

export const MessagesArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 10px;
`

export const MessageInputArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px;

  textarea {
    flex: 1;
    resize: none;
  }

  border-top: 1px solid #e8e8e8;
`

export const EmptyChat = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`

// =================================================== MESSAGE COMPONENT

export const MessageContainer = styled.div<{ own: number }>`
  display: flex;
  margin-bottom: 10px;
  justify-content: ${({ own }) => (own ? 'flex-end' : 'flex-start')};
`

export const MessageAvatar = styled(Avatar)`
  width: 28px;
  height: 28px;
  padding-top: 1px;

  ${fontSize('xxxs')}
  ${fontHeight('xxxs')}
`

export const MessageContent = styled.div<{ own: number }>`
  display: flex;
  flex-direction: column;
  row-gap: 6px;
  max-width: 60%;
  margin: 0 10px;
  padding: 12px;
  border-radius: 6px;

  background: ${({ own }) => (own ? '#1890ff' : '#f0f0f0')};
  color: ${({ own }) => (own ? 'white' : 'black')};
`

export const MessageContentText = styled.p`
  ${fontSize('xxxs')}
  ${fontHeight('small')}
  ${fontWeight('regular')}

	white-space: wrap;
  word-wrap: break-word;
`

export const MessageContentDate = styled.p`
  ${fontSize('ss')}
  ${fontHeight('ss')}
  ${fontWeight('regular')}

	opacity: 0.8;
`
