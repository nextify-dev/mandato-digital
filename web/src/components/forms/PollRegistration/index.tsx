// src/components/forms/PollRegistration/index.tsx

import React, { forwardRef, Ref, useEffect, useCallback } from 'react'
import * as S from './styles'
import {
  Controller,
  UseFormReturn,
  DefaultValues,
  useFieldArray
} from 'react-hook-form'
import { Select, Button, Input, Switch, message } from 'antd'
import { StyledForm, StyledButton, StyledSteps } from '@/utils/styles/antd'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  PollRegistrationFormType,
  getPollRegistrationSchema,
  PollQuestionType,
  PollQuestion
} from '@/@types/poll'
import { Segment } from '@/@types/segment'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'
import { useAuth } from '@/contexts/AuthProvider'
import { UserRole } from '@/@types/user'
import { DragOutlined } from '@ant-design/icons'
import { v4 as uuidv4 } from 'uuid'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface PollRegistrationFormProps {
  onSubmit?: (data: PollRegistrationFormType) => Promise<void>
  initialData?: Partial<PollRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  loading?: boolean
  segments: Segment[]
}

const PollRegistrationForm = forwardRef<
  UseFormReturn<PollRegistrationFormType>,
  PollRegistrationFormProps
>(
  (
    {
      onSubmit,
      initialData,
      mode,
      currentStep,
      setCurrentStep,
      loading,
      segments
    },
    ref: Ref<UseFormReturn<PollRegistrationFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const { user } = useAuth()

    const defaultValues: DefaultValues<PollRegistrationFormType> = {
      title: '',
      description: '',
      segmentId: '',
      questions: [],
      cityIds: [],
      isActive: true
    }

    const formMethods = useModalForm<PollRegistrationFormType>({
      schema: getPollRegistrationSchema(),
      defaultValues,
      onSubmit
    })

    React.useImperativeHandle(ref, () => formMethods)

    const {
      control,
      setValue,
      trigger,
      watch,
      reset,
      formState: { errors, isValid }
    } = formMethods

    const {
      fields: questions,
      append,
      remove,
      move
    } = useFieldArray({
      control,
      name: 'questions'
    })

    useEffect(() => {
      if (mode === 'create') {
        reset(defaultValues)
        setCurrentStep(0)
      } else if (initialData && (mode === 'edit' || mode === 'viewOnly')) {
        reset({ ...defaultValues, ...initialData })
        setCurrentStep(0)
      }
    }, [initialData, mode, reset, setCurrentStep])

    const formData = watch()

    const SEGMENT_OPTIONS = segments.map((segment) => ({
      label: segment.name,
      value: segment.id
    }))

    const QUESTION_TYPE_OPTIONS = Object.values(PollQuestionType).map(
      (type) => ({
        label: type.replace('_', ' ').toLowerCase(),
        value: type
      })
    )

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['title', 'description', 'segmentId', 'isActive'],
        requiredFields: ['title', 'segmentId']
      },
      {
        title: 'Perguntas',
        fields: ['questions'],
        requiredFields: ['questions']
      },
      { title: 'Revisão', fields: [], requiredFields: [] }
    ]

    const areRequiredFieldsValid = useCallback(
      (stepIndex: number) => {
        const requiredFields = steps[stepIndex].requiredFields
        return requiredFields.every((field) => {
          const value = formData[field as keyof PollRegistrationFormType]
          const hasError = !!errors[field as keyof PollRegistrationFormType]
          if (field === 'questions') {
            return value && (value as any[]).length > 0 && !hasError
          }
          return value !== undefined && value !== '' && !hasError
        })
      },
      [formData, errors]
    )

    const validateStep = useCallback(
      async (stepIndex: number) => {
        const fieldsToValidate = steps[stepIndex]
          .fields as (keyof PollRegistrationFormType)[]
        const isStepValid = await trigger(fieldsToValidate, {
          shouldFocus: true
        })
        return isStepValid && areRequiredFieldsValid(stepIndex)
      },
      [trigger, areRequiredFieldsValid]
    )

    const validateAllSteps = useCallback(async () => {
      const validations = await Promise.all(
        steps.map((_, index) => validateStep(index))
      )
      const allStepsValid = validations.every((valid) => valid)
      if (!allStepsValid) {
        messageApi.error('Por favor, corrija os erros antes de enviar.')
      }
      return allStepsValid
    }, [validateStep, messageApi])

    const nextStep = async () => {
      if (await validateStep(currentStep)) {
        setCurrentStep((prev) => prev + 1)
      } else {
        messageApi.error('Preencha todos os campos obrigatórios corretamente.')
      }
    }

    const prevStep = () => setCurrentStep((prev) => prev - 1)

    const handleSubmitClick = async () => {
      if (await validateAllSteps()) {
        const selectedSegment = segments.find(
          (s) => s.id === formData.segmentId
        )
        if (selectedSegment) {
          setValue('cityIds', selectedSegment.cityIds)
        }
        await onSubmit?.(formData)
      }
    }

    const addQuestion = () => {
      append({
        id: uuidv4(),
        title: '',
        type: PollQuestionType.MULTIPLE_CHOICE,
        options: [
          { id: uuidv4(), value: '' },
          { id: uuidv4(), value: '' }
        ],
        isRequired: false
      })
    }

    const descriptionFields: DynamicDescriptionsField<PollRegistrationFormType>[] =
      [
        { key: 'title', label: 'Título da Enquete' },
        {
          key: 'description',
          label: 'Descrição',
          render: (value) => value || '-'
        },
        {
          key: 'segmentId',
          label: 'Segmento',
          render: (value) => segments.find((s) => s.id === value)?.name || '-'
        },
        {
          key: 'isActive',
          label: 'Ativo',
          render: (value) => (value ? 'Sim' : 'Não')
        },
        {
          key: 'questions',
          label: 'Perguntas',
          render: (questions: PollQuestion[]) => (
            <div>
              {questions.map((q, index) => (
                <div key={q.id}>
                  <strong>
                    {index + 1}. {q.title}
                  </strong>{' '}
                  ({q.type.replace('_', ' ').toLowerCase()})
                  {q.options && (
                    <ul>
                      {q.options.map((opt) => (
                        <li key={opt.id}>{opt.value}</li>
                      ))}
                    </ul>
                  )}
                  <p>Obrigatória: {q.isRequired ? 'Sim' : 'Não'}</p>
                  {q.maxLength && <p>Comprimento Máximo: {q.maxLength}</p>}
                  {q.ratingScale && (
                    <p>Escala de Avaliação: 1 a {q.ratingScale}</p>
                  )}
                </div>
              ))}
            </div>
          )
        }
      ]

    const renderViewOnlyMode = () => (
      <FormStep visible={1}>
        <DynamicDescriptions
          data={initialData ?? {}}
          fields={descriptionFields}
        />
      </FormStep>
    )

    if (mode === 'viewOnly') return renderViewOnlyMode()

    return (
      <>
        <StyledForm onFinish={() => {}} layout="vertical">
          <StyledSteps
            current={currentStep}
            items={steps.map((step) => ({ title: step.title }))}
            labelPlacement="vertical"
          />
          <S.PollRegistrationFormContent>
            <BasicDataStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
              segmentOptions={SEGMENT_OPTIONS}
            />
            <QuestionsStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 1}
              questions={questions}
              remove={remove}
              move={move}
              addQuestion={addQuestion}
              questionTypeOptions={QUESTION_TYPE_OPTIONS}
            />
            <ReviewStep
              control={control}
              errors={errors}
              formData={formData}
              setValue={setValue}
              visible={currentStep === 2}
              descriptionFields={descriptionFields}
              initialData={initialData}
            />
          </S.PollRegistrationFormContent>
          <S.PollRegistrationFormFooter>
            {currentStep > 0 && (
              <StyledButton onClick={prevStep}>Voltar</StyledButton>
            )}
            {currentStep < steps.length - 1 && (
              <StyledButton
                type="primary"
                onClick={nextStep}
                loading={loading}
                disabled={!areRequiredFieldsValid(currentStep) || loading}
              >
                Próximo
              </StyledButton>
            )}
            {currentStep === steps.length - 1 && (
              <StyledButton
                type="primary"
                onClick={handleSubmitClick}
                loading={loading}
                disabled={!isValid || loading}
              >
                {mode === 'edit' ? 'Atualizar Enquete' : 'Criar Enquete'}
              </StyledButton>
            )}
          </S.PollRegistrationFormFooter>
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

PollRegistrationForm.displayName = 'PollRegistrationForm'

export default PollRegistrationForm

interface IPollRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  visible: boolean
  segmentOptions?: { label: string; value: string }[]
  questionTypeOptions?: { label: string; value: string }[]
  questions?: any[]
  remove?: (index: number) => void
  move?: (from: number, to: number) => void
  addQuestion?: () => void
  descriptionFields?: DynamicDescriptionsField<PollRegistrationFormType>[]
  initialData?: Partial<PollRegistrationFormType>
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible,
  segmentOptions
}: IPollRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Título da Enquete"
            help={errors.title?.message}
            validateStatus={errors.title ? 'error' : ''}
          >
            <Input
              {...field}
              placeholder="Digite o título da enquete"
              value={field.value}
              onChange={(e) => setValue('title', e.target.value)}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Descrição (opcional)"
            help={errors.description?.message}
            validateStatus={errors.description ? 'error' : ''}
          >
            <TextArea
              {...field}
              placeholder="Descreva o objetivo desta enquete"
              value={field.value}
              onChange={(e) => setValue('description', e.target.value)}
              rows={4}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="segmentId"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Segmento"
            help={errors.segmentId?.message}
            validateStatus={errors.segmentId ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione o segmento"
              options={segmentOptions}
              onChange={(value) => setValue('segmentId', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <StyledForm.Item label="Ativo">
            <Switch
              checked={field.value}
              onChange={(checked) => setValue('isActive', checked)}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const QuestionsStep = ({
  control,
  errors,
  setValue,
  visible,
  questions,
  remove,
  move,
  addQuestion,
  questionTypeOptions
}: IPollRegistrationStep) => {
  const {
    fields: optionsFields,
    append: appendOption,
    remove: removeOption
  } = useFieldArray({
    control,
    name: 'questions'
  })

  const handleDragSort = (fromIndex: number, toIndex: number) => {
    move?.(fromIndex, toIndex)
  }

  return (
    <FormStep visible={visible ? 1 : 0}>
      <StyledForm.Item
        label="Perguntas"
        help={errors.questions?.message}
        validateStatus={errors.questions ? 'error' : ''}
      >
        {questions?.map((question, index) => (
          <S.QuestionWrapper key={question.id}>
            <S.QuestionHeader>
              <h4>Pergunta {index + 1}</h4>
              <Button type="link" danger onClick={() => remove?.(index)}>
                Remover
              </Button>
            </S.QuestionHeader>
            <Controller
              name={`questions.${index}.title`}
              control={control}
              render={({ field }) => (
                <StyledForm.Item
                  label="Título da Pergunta"
                  help={errors.questions?.[index]?.title?.message}
                  validateStatus={
                    errors.questions?.[index]?.title ? 'error' : ''
                  }
                >
                  <Input
                    {...field}
                    placeholder="Digite o título da pergunta"
                    value={field.value}
                    onChange={(e) =>
                      setValue(`questions.${index}.title`, e.target.value)
                    }
                  />
                </StyledForm.Item>
              )}
            />
            <Controller
              name={`questions.${index}.type`}
              control={control}
              render={({ field }) => (
                <StyledForm.Item
                  label="Tipo da Pergunta"
                  help={errors.questions?.[index]?.type?.message}
                  validateStatus={
                    errors.questions?.[index]?.type ? 'error' : ''
                  }
                >
                  <Select
                    {...field}
                    placeholder="Selecione o tipo da pergunta"
                    options={questionTypeOptions}
                    onChange={(value) =>
                      setValue(`questions.${index}.type`, value)
                    }
                    value={field.value}
                  />
                </StyledForm.Item>
              )}
            />
            {question.type === PollQuestionType.MULTIPLE_CHOICE && (
              <S.OptionsWrapper>
                <h5>Opções</h5>
                {question.options?.map((option: any, optIndex: number) => (
                  <S.OptionRow key={option.id}>
                    <Controller
                      name={`questions.${index}.options.${optIndex}.value`}
                      control={control}
                      render={({ field }) => (
                        <StyledForm.Item
                          help={
                            errors.questions?.[index]?.options?.[optIndex]
                              ?.value?.message
                          }
                          validateStatus={
                            errors.questions?.[index]?.options?.[optIndex]
                              ?.value
                              ? 'error'
                              : ''
                          }
                        >
                          <Input
                            {...field}
                            placeholder={`Opção ${optIndex + 1}`}
                            value={field.value}
                            onChange={(e) =>
                              setValue(
                                `questions.${index}.options.${optIndex}.value`,
                                e.target.value
                              )
                            }
                          />
                        </StyledForm.Item>
                      )}
                    />
                    <Button
                      type="link"
                      danger
                      onClick={() => {
                        const options =
                          control._formValues.questions[index].options
                        if (options.length > 2) {
                          setValue(
                            `questions.${index}.options`,
                            options.filter(
                              (_: any, i: number) => i !== optIndex
                            )
                          )
                        } else {
                          // messageApi.warning('Deve haver pelo menos 2 opções.')
                        }
                      }}
                    >
                      Remover
                    </Button>
                  </S.OptionRow>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    setValue(`questions.${index}.options`, [
                      ...control._formValues.questions[index].options,
                      { id: uuidv4(), value: '' }
                    ])
                  }
                  block
                >
                  Adicionar Opção
                </Button>
              </S.OptionsWrapper>
            )}
            {question.type === PollQuestionType.TEXT && (
              <Controller
                name={`questions.${index}.maxLength`}
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Comprimento Máximo"
                    help={errors.questions?.[index]?.maxLength?.message}
                    validateStatus={
                      errors.questions?.[index]?.maxLength ? 'error' : ''
                    }
                  >
                    <Input
                      type="number"
                      {...field}
                      placeholder="Digite o comprimento máximo"
                      value={field.value}
                      onChange={(e) =>
                        setValue(
                          `questions.${index}.maxLength`,
                          Number(e.target.value)
                        )
                      }
                    />
                  </StyledForm.Item>
                )}
              />
            )}
            {question.type === PollQuestionType.RATING && (
              <Controller
                name={`questions.${index}.ratingScale`}
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Escala de Avaliação (1 a X)"
                    help={errors.questions?.[index]?.ratingScale?.message}
                    validateStatus={
                      errors.questions?.[index]?.ratingScale ? 'error' : ''
                    }
                  >
                    <Input
                      type="number"
                      {...field}
                      placeholder="Digite a escala (ex.: 5 para 1-5)"
                      value={field.value}
                      onChange={(e) =>
                        setValue(
                          `questions.${index}.ratingScale`,
                          Number(e.target.value)
                        )
                      }
                    />
                  </StyledForm.Item>
                )}
              />
            )}
            <Controller
              name={`questions.${index}.isRequired`}
              control={control}
              render={({ field }) => (
                <StyledForm.Item label="Obrigatória">
                  <Switch
                    checked={field.value}
                    onChange={(checked) =>
                      setValue(`questions.${index}.isRequired`, checked)
                    }
                  />
                </StyledForm.Item>
              )}
            />
          </S.QuestionWrapper>
        ))}
        <Button type="dashed" onClick={addQuestion} block>
          Adicionar Pergunta
        </Button>
      </StyledForm.Item>
    </FormStep>
  )
}

const ReviewStep = ({
  control,
  errors,
  formData,
  setValue,
  visible,
  descriptionFields,
  initialData
}: IPollRegistrationStep) => (
  <FormStep visible={visible ? 1 : 0}>
    <DynamicDescriptions data={formData} fields={descriptionFields || []} />
  </FormStep>
)
