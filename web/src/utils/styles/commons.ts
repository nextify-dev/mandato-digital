// src/utils/styles/commons.ts

import styled from 'styled-components'
import { Form, Menu } from 'antd'

import { color, backgroundColor } from './colors'
import { Globals } from './globals'

// ===================================================== SCREEN

export const Screen = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: fit-content;
  min-height: 100vh;
`

// ===================================================== VIEW

export const View = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  width: 100%;
  height: 100%;
  padding: ${Globals.layout.padding};
  border-radius: 8px;

  border: 1px solid ${color('colorBorderSecondary')};
  ${backgroundColor('colorBgBase')}
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.04);
`

export const ViewHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: ${Globals.layout.content.headerHeight};
  padding: 0 ${Globals.layout.padding};
  border-radius: 6px;

  border: 1px solid ${color('colorBorderSecondary')};
`

export const ViewContent = styled.div`
  width: 100%;
  height: fit-content;
`

// ===================================================== FORM

export const FormStep = styled.div<{ visible: number }>`
  display: ${({ visible }) => (visible ? 'flex' : 'none')};
  flex-direction: column;
  row-gap: 10px;
  width: 100%;
  max-height: 420px;
  overflow: auto;
  padding: 5px 5px 5px 0;

  &::-webkit-scrollbar {
    width: 4px;
    border-radius: 10px;
    z-index: 1000;
  }

  &::-webkit-scrollbar-track {
    border-radius: 10px;
    ${backgroundColor('colorBorderSecondary')}
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    ${backgroundColor('colorBorder')}
  }
`

export const FormInputsWrapper = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  height: fit-content;
`

// ===================================================== TABLE

export const TableExtrasWrapper = styled.div`
  display: flex;
  gap: 6px;

  button.ant-btn {
    width: fit-content !important;
    padding: 0 4px;
  }
`
