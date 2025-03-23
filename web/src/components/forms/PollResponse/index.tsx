// src/components/forms/PollResponseForm/index.tsx

import React, { forwardRef, Ref } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Button, Input, Radio, Rate, Switch, message } from 'antd'
import { StyledForm, StyledButton } from '@/utils/styles/antd'
import { FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  PollQuestion,
  PollQuestionType,
  PollResponseFormType,
  getPollResponseSchema
} from '@/@types/poll'

interface PollResponseFormProps {
  onSubmit: (data: PollResponseFormType) => Promise<void>
  questions: PollQuestion[]
  loading?: boolean
}

const PollResponseForm = forwardRef<
  UseFormReturn<PollResponseFormType>,
  PollResponseFormProps
>(
  (
    { onSubmit, questions, loading },
    ref: Ref<UseFormReturn<PollResponseFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()

    const defaultValues: DefaultValues<PollResponseFormType> = {
      answers: questions.map((question) => ({
        questionId: question.id,
        value: ''
      }))
    }

    const formMethods = useModalForm<PollResponseFormType>({
      schema: getPollResponseSchema(questions),
      defaultValues,
      onSubmit
    })

    React.useImperativeHandle(ref, () => formMethods)

    const {
      control,
      setValue,
      formState: { errors, isValid }
    } = formMethods

    return (
      <>
        <StyledForm
          onFinish={formMethods.handleSubmit(onSubmit)}
          layout="vertical"
        >
          <FormStep visible={1}>
            {questions.map((question, index) => (
              <S.QuestionWrapper key={question.id}>
                <S.QuestionHeader>
                  <h4>
                    {index + 1}. {question.title}
                    {question.isRequired && (
                      <span style={{ color: 'red' }}> *</span>
                    )}
                  </h4>
                </S.QuestionHeader>
                <Controller
                  name={`answers.${index}.questionId`}
                  control={control}
                  defaultValue={question.id}
                  render={({ field }) => <input type="hidden" {...field} />}
                />
                <Controller
                  name={`answers.${index}.value`}
                  control={control}
                  render={({ field }) => (
                    <StyledForm.Item
                      help={errors.answers?.[index]?.value?.message}
                      validateStatus={
                        errors.answers?.[index]?.value ? 'error' : ''
                      }
                    >
                      {question.type === PollQuestionType.MULTIPLE_CHOICE && (
                        <Radio.Group
                          {...field}
                          onChange={(e) =>
                            setValue(`answers.${index}.value`, e.target.value)
                          }
                          value={field.value}
                        >
                          {question.options?.map((option) => (
                            <Radio key={option.id} value={option.value}>
                              {option.value}
                            </Radio>
                          ))}
                        </Radio.Group>
                      )}
                      {question.type === PollQuestionType.TEXT && (
                        <Input.TextArea
                          {...field}
                          placeholder="Digite sua resposta"
                          value={field.value}
                          onChange={(e) =>
                            setValue(`answers.${index}.value`, e.target.value)
                          }
                          maxLength={question.maxLength}
                          showCount
                        />
                      )}
                      {question.type === PollQuestionType.RATING && (
                        <Rate
                          {...field}
                          count={question.ratingScale}
                          value={Number(field.value) || 0}
                          onChange={(value) =>
                            setValue(`answers.${index}.value`, value.toString())
                          }
                        />
                      )}
                      {question.type === PollQuestionType.YES_NO && (
                        <Switch
                          checked={field.value === 'Sim'}
                          onChange={(checked) =>
                            setValue(
                              `answers.${index}.value`,
                              checked ? 'Sim' : 'Não'
                            )
                          }
                          checkedChildren="Sim"
                          unCheckedChildren="Não"
                        />
                      )}
                    </StyledForm.Item>
                  )}
                />
              </S.QuestionWrapper>
            ))}
          </FormStep>
          <S.PollResponseFormFooter>
            <StyledButton
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!isValid || loading}
            >
              Enviar Resposta
            </StyledButton>
          </S.PollResponseFormFooter>
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

PollResponseForm.displayName = 'PollResponseForm'

export default PollResponseForm
