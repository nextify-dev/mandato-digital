// src/components/Modal.tsx

import styled from 'styled-components'

import { ModalProps } from 'antd'

import { backgroundColor, color } from '@/utils/styles/colors'
import { StyledModal } from '@/utils/styles/antd'

interface IModalProps extends ModalProps {
  children: React.ReactNode
}

const Modal = ({ children, ...props }: IModalProps) => {
  return <StyledModal {...props}>{children}</StyledModal>
}

export default Modal
