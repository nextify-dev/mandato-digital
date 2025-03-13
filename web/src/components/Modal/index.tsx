// src/components/Modal.tsx

import * as S from './styles'

import { ModalProps } from 'antd'
import { StyledModal } from '@/utils/styles/antd'

export type ModalSize = 'small' | 'default' | 'large'

interface IModalProps extends ModalProps {
  children: React.ReactNode
  size?: ModalSize
}

const Modal = ({ children, size = 'default', ...props }: IModalProps) => {
  return (
    <StyledModal size={size} {...props}>
      {children}
    </StyledModal>
  )
}

export default Modal
