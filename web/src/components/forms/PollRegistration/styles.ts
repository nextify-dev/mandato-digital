// src/components/forms/PollRegistration/styles.ts

import styled from 'styled-components'

export const PollRegistrationFormContent = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 20px;
  width: 100%;
`

export const PollRegistrationFormFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  column-gap: 8px;
  width: 100%;
`

export const QuestionWrapper = styled.div`
  border: 1px solid #d9d9d9;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
`

export const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

export const OptionsWrapper = styled.div`
  margin-top: 16px;
`

export const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`
