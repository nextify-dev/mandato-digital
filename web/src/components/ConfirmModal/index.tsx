// src/components/ConfirmModal.tsx

import * as S from './styles'

import React from 'react'
import { Button } from 'antd'
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'

// Tipos disponíveis para o modal
export type ModalType = 'success' | 'warning' | 'danger'

// Props do componente
interface ConfirmModalProps {
  type: ModalType
  title: string
  content: string | React.ReactNode
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  confirmLoading?: boolean
}

// Estilização customizada

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  type,
  title,
  content,
  visible,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmLoading = false
}) => {
  // Função para determinar o ícone com base no tipo
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
        )
      case 'warning':
        return (
          <ExclamationCircleOutlined
            style={{ fontSize: '24px', color: '#faad14' }}
          />
        )
      case 'danger':
        return (
          <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
        )
      default:
        return null
    }
  }

  return (
    <S.ConfirmModal
      type={type}
      title={
        <>
          {getIcon()}
          <span>{title}</span>
        </>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={onConfirm}
          loading={confirmLoading}
        >
          {confirmText}
        </Button>
      ]}
      width={400}
      centered
    >
      {content}
    </S.ConfirmModal>
  )
}

export default ConfirmModal
