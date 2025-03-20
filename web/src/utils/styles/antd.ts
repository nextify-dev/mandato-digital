// src/utils/styles/antd.ts

import styled from 'styled-components'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Form,
  Input,
  Menu,
  Modal,
  Result,
  Steps,
  Table,
  theme,
  Tooltip,
  Upload
} from 'antd'

import { font } from './fonts'
import { color, backgroundColor, textColor } from './colors'
import { ModalSize } from '@/components/Modal'

const { useToken } = theme

export const StyledForm = styled(Form)<{ onFinish: any }>`
  display: flex;
  flex-direction: column;
  row-gap: 25px;
  width: 100%;

  .ant-form-item {
    width: 100%;
    margin-bottom: 0px;

    .ant-form-item-label {
      padding-bottom: 5px !important;

      label {
        ${font('xxs')}
      }
    }

    .ant-input-password {
      padding: 0 11px;
      box-shadow: none !important;

      .ant-input {
        padding: 0;
        padding-bottom: 1px;
        height: 32.4px;
      }
    }

    .ant-input {
      ${font('small')}
      height: 34px;
      padding: 0 11px 1px 11px;

      &:focus {
        box-shadow: none !important;
      }

      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus,
      &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px ${backgroundColor('colorBgElevated')}
          inset !important;
        -webkit-text-fill-color: ${color('colorTextBase')} !important;
      }
    }

    .ant-form-item-explain-error {
      margin-top: 5px;
      ${font('xxs')}
    }

    .ant-picker-input input {
      ${font('small')}
      padding: 3px 0px 3px 0px;
    }

    .ant-select-selection-placeholder {
      ${font('small')}
    }
  }

  .ant-picker {
    width: 100%;
    padding-block: 2px !important;

    input {
      ${font('small')}
    }
  }

  textarea {
    resize: none;
    height: initial !important;
    padding: 8px 11px !important;
  }

  .ant-segmented-item {
    transition: ${color('colorPrimary')} 3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
  }

  .ant-segmented-item-selected {
    ${backgroundColor('colorPrimary')}
    ${color('colorText')}
  }

  .ant-segmented-thumb {
    ${backgroundColor('colorPrimary')}
    ${color('colorText')}
  }

  .ant-upload {
    width: 80px !important;
    height: 80px !important;
  }
`

export const StyledMenu = styled(Menu)<{ opened: number }>`
  &.ant-menu {
    border-right: none !important;

    .ant-menu-item-group-title {
      display: ${({ opened }) => (opened ? 'block' : 'none')} !important;
      padding: 10px 0px 2px 4px !important;
      ${font('xxs')}
      ${color('colorTextDescription')}
    }

    .ant-menu-item {
      height: 34px !important;
      padding: ${({ opened }) => (opened ? '0 14px' : '0 14px')} !important;
      border-radius: 6px !important;

      .anticon svg {
        ${font('small')}
      }

      .ant-menu-title-content {
        display: ${({ opened }) => (opened ? 'inline' : 'none')} !important;
        ${font('xxs')}
      }
    }
  }
`

export const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox + span {
    ${font('xxs')}
    color: ${color('colorTextBase')};
  }
`

export const StyledButton = styled(Button)``

export const StyledInput = styled(Input)`
  ${font('small')}
  height: 40px;
  padding: 0 12px;
  border-radius: 6px;

  &:focus {
    box-shadow: none !important;
  }
`

export const StyledAlert = styled(Alert)`
  border-radius: 6px;
  margin-bottom: 16px;
`

export const StyledSteps = styled(Steps)`
  width: 100%;
  margin-left: -8px;

  .ant-steps-item {
    .ant-steps-item-container {
      .ant-steps-item-content {
      }
    }
  }
  .ant-steps-item-title {
    ${font('xxxs')};
    margin-top: -5px;
  }
`

export const StyledDescriptions = styled(Descriptions)`
  .ant-descriptions-item-label {
    ${font('xxs')};

    width: 150px !important;
    padding: 5px 10px !important;
  }

  .ant-descriptions-item-content {
    ${font('xxs')};

    padding: 8px 12px !important;
  }
`

export const StyledTable = styled(Table)<{ empty: number }>`
  width: 100%;
  max-width: 100%;
  table-layout: fixed;

  table {
    overflow: hidden;
  }

  .ant-table-row-disabled {
    pointer-events: none;
    background-color: rgba(0, 0, 0, 0.05);
  }

  .ant-table-thead {
    th.ant-table-cell {
      align-items: center;
      height: 42px !important;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:not(:first-of-type) {
        padding-top: 2px !important;
      }
    }
  }

  .ant-table-cell {
    padding: 0 16px !important;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    ${font('xxs')}

    &:last-of-type {
      display: flex;
      justify-content: flex-end;
    }
  }

  .ant-table-row {
    td {
      align-items: center;
      height: 50px !important;
    }

    &:last-of-type td {
      border-bottom: none;
    }
  }

  .ant-table-content table {
    border-radius: 8px;
    border: 1px solid ${() => useToken().token.colorBorderSecondary};
  }

  /* Estilização para colunas dinâmicas */
  ${({ columns }) =>
    columns &&
    columns.length > 0 &&
    `
    .ant-table-thead th,
    .ant-table-tbody td {
      ${columns
        .map(
          (col, index) => `
          &:nth-child(${index + 1}) {
            width: auto;
            min-width: 50px;
            max-width: ${
              col.width
                ? typeof col.width === 'number'
                  ? `${col.width}px`
                  : col.width
                : '100%'
            };
          }
        `
        )
        .join('')}
    }
  `}

  /* Estilização para estado vazio */
  ${({ empty }) =>
    empty > 0 &&
    `
    pointer-events: none;

    .ant-table-content {
      position: relative !important;
      border-radius: 8px;
    }

    tbody {
      height: 260px;
    }

    tbody .ant-table-cell {
      border: 2px solid red !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      border: none !important;
    }
  `}

  /* Estilização para estado carregando */
  ${({ loading }) =>
    loading &&
    `
    .ant-result {
      display: none;
    }
  `}
` as unknown as typeof Table

export const TableEmptyResult = styled(Result)`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin-top: 20px;

  img {
    width: 90px;
    margin-bottom: -10px;
  }

  .ant-result-title {
    font-weight: 500;

    ${font('regular')}
  }

  .ant-result-subtitle {
    font-weight: 400;

    ${font('xxs')}
  }
`

const modalSizes = {
  small: '400px',
  default: '500px',
  large: '620px'
}

export const StyledModal = styled(Modal)<{ size?: ModalSize }>`
  width: ${({ size }) => modalSizes[size || 'default']} !important;
  margin: 20px auto;

  .ant-modal-content {
    border-radius: 8px;

    ${backgroundColor('colorBgBase')}
    border: 1px solid ${color('colorBorderSecondary')};
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.04);
  }

  .ant-modal-header {
    padding: 10px 0;
    margin-bottom: 20px;

    .ant-modal-title {
      font-weight: 500 !important;

      ${font('regular')}
    }
  }

  .ant-modal-close {
    top: 22px;
  }

  .ant-modal-footer {
    border-top: 1px solid ${color('colorBorderSecondary')};
  }

  /* @media (max-width: 768px) {
    .ant-modal-content {
      width: ${({ size }) =>
    size === 'large' ? '90vw' : size === 'small' ? '80vw' : '85vw'};
    }
  } */
`

export const StyledAvatar = styled(Avatar)`
  padding-top: 2px;

  ${font('regular')}
  ${backgroundColor('colorPrimary')}
`

export const StyledTooltip = styled(Tooltip)`
  /* padding-top: 2px;

  ${font('regular')}
  ${backgroundColor('colorPrimary')} */
`

export const StyledUpload = styled(Upload)`
  div.ant-upload {
    height: fit-content !important;
    margin-bottom: 10px;
  }

  .ant-upload-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    row-gap: 8px;
  }
`

export const StyledCard = styled(Card)`
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 10px;

  /* ${font('regular')} */
  /* ${backgroundColor('colorPrimary')} */
`
