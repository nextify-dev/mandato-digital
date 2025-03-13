// src/components/ConfirmModal/styles.ts

import styled from 'styled-components'
import { Modal, theme } from 'antd'

import { ModalType } from '.'

export const ConfirmModal = styled(Modal)<{ type: ModalType }>`
  .ant-modal-header {
    border-bottom: none;
    padding-bottom: 0;
  }

  .ant-modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ type }) =>
      type === 'success'
        ? '#52c41a'
        : type === 'warning'
        ? '#faad14'
        : '#ff4d4f'};
  }

  .ant-modal-body {
    padding-top: 8px;
  }

  .ant-modal-footer {
    border-top: none;
    padding-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .ant-btn-primary {
    background-color: ${({ type }) =>
      type === 'success'
        ? '#52c41a'
        : type === 'warning'
        ? '#faad14'
        : '#ff4d4f'};
    border-color: ${({ type }) =>
      type === 'success'
        ? '#52c41a'
        : type === 'warning'
        ? '#faad14'
        : '#ff4d4f'};
  }

  .ant-btn-primary:hover,
  .ant-btn-primary:focus {
    background-color: ${({ type }) =>
      type === 'success'
        ? '#73d13d'
        : type === 'warning'
        ? '#ffc107'
        : '#ff7875'};
    border-color: ${({ type }) =>
      type === 'success'
        ? '#73d13d'
        : type === 'warning'
        ? '#ffc107'
        : '#ff7875'};
  }
`
