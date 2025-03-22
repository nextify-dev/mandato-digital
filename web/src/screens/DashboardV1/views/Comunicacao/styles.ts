// src/screens/DashboardV1/views/Comunicacao/styles.ts

import { textColor } from '@/utils/styles/colors'
import { font } from '@/utils/styles/fonts'
import { List, Tag } from 'antd'
import styled from 'styled-components'

export const ComunicacaoView = styled.div`
  display: flex;
  height: 100%;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

// ========================================= TICKET LIST & TICKET ITEM

export const TicketList = styled.div`
  width: 25%;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  padding: 10px;
`

export const TicketItem = styled(List.Item)<{ active: number }>`
  display: flex;
  cursor: pointer;
  padding: 10px;

  background-color: ${({ active }) => (active ? '#f0f0f0' : 'white')};
`

export const TicketItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`

export const TicketItemTitle = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 3px;

  h3 {
    ${font('small')}
    font-weight: 500;
  }

  span {
    ${font('xxxs')}
    ${textColor('colorTextSecondary')}
    font-weight: 300;
  }
`

export const TicketItemTag = styled(Tag)`
  height: fit-content;
`

export const TicketItemDescriptions = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 3px;

  p {
    ${font('xs')}
    ${textColor('colorTextSecondary')}
    font-weight: 300;

    b {
      font-weight: 500;
    }
  }
`

export const TicketItemDescriptionSince = styled.div`
  display: flex;
`

// ========================================= CHAT

export const ChatWindow = styled.div`
  width: 75%;
  display: flex;
  flex-direction: column;
  padding: 10px;
`

export const ChatHeader = styled.div`
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 10px;
  margin-bottom: 10px;
`

export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
`

export const MessageContainer = styled.div<{ own: number }>`
  display: flex;
  margin-bottom: 10px;
  justify-content: ${({ own }) => (own ? 'flex-end' : 'flex-start')};
`

export const MessageContent = styled.div<{ own: number }>`
  background: ${({ own }) => (own ? '#1890ff' : '#f0f0f0')};
  color: ${({ own }) => (own ? 'white' : 'black')};
  padding: 10px;
  border-radius: 10px;
  max-width: 60%;
  margin: 0 10px;
`

export const MessageInputArea = styled.div`
  display: flex;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #e8e8e8;
  gap: 10px;

  textarea {
    flex: 1;
  }
`
