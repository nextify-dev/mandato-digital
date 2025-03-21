// src/components/forms/TicketRegistrationForm/index.tsx

import React, { forwardRef, Ref, useEffect, useState } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, Input, Upload, Button, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { StyledForm, StyledButton, StyledSteps } from '@/utils/styles/antd'
import { FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  TicketRegistrationFormType,
  getTicketRegistrationSchema
} from '@/@types/tickets'
import { User } from '@/@types/user'
import { UploadFile, UploadProps } from 'antd/lib/upload/interface'

const { TextArea } = Input

type FormMode = 'create' | 'edit'

interface TicketRegistrationFormProps {
  onSubmit?: (data: TicketRegistrationFormType) => Promise<void>
  initialData?: Partial<TicketRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  allowedContacts: User[]
  loading?: boolean
}

const TicketRegistrationForm = forwardRef<
  UseFormReturn<TicketRegistrationFormType>,
  TicketRegistrationFormProps
>(
  (
    {
      onSubmit,
      initialData,
      mode,
      currentStep,
      setCurrentStep,
      allowedContacts,
      loading
    },
    ref: Ref<UseFormReturn<TicketRegistrationFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const [fileList, setFileList] = useState<UploadFile[]>([])

    const defaultValues: DefaultValues<TicketRegistrationFormType> = {
      title: '',
      description: '',
      participants: [],
      initialMessage: '',
      attachments: null
    }

    const formMethods = useModalForm<TicketRegistrationFormType>({
      schema: getTicketRegistrationSchema(mode),
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

    useEffect(() => {
      if (mode === 'create') {
        reset(defaultValues)
        setFileList([])
        setCurrentStep(0)
      } else if (initialData && mode === 'edit') {
        reset({ ...defaultValues, ...initialData })
        setCurrentStep(0)
      }
    }, [initialData, mode, reset, setCurrentStep])

    const formData = watch()

    const PARTICIPANT_OPTIONS = allowedContacts.map((contact) => ({
      label: `${contact.profile?.nomeCompleto} (${contact.role})`,
      value: contact.id
    }))

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['title', 'description'],
        requiredFields: ['title', 'description']
      },
      {
        title: 'Participantes',
        fields: ['participants'],
        requiredFields: ['participants']
      },
      {
        title: 'Mensagem Inicial',
        fields: ['initialMessage', 'attachments'],
        requiredFields: []
      }
    ]

    const areRequiredFieldsValid = () => {
      const requiredFields = steps[currentStep].requiredFields
      return requiredFields.every((field) => {
        const value = formData[field as keyof TicketRegistrationFormType]
        const hasError = !!errors[field as keyof TicketRegistrationFormType]
        return value !== undefined && value !== '' && !hasError
      })
    }

    const validateStep = async () => {
      const fieldsToValidate = steps[currentStep]
        .fields as (keyof TicketRegistrationFormType)[]
      return await trigger(fieldsToValidate, { shouldFocus: true })
    }

    const nextStep = async () => {
      if ((await validateStep()) && areRequiredFieldsValid()) {
        setCurrentStep((prev) => prev + 1)
      } else {
        messageApi.error('Preencha todos os campos obrigatórios corretamente.')
      }
    }

    const prevStep = () => setCurrentStep((prev) => prev - 1)

    const handleSubmitClick = async () => {
      if ((await validateStep()) && areRequiredFieldsValid()) {
        const updatedValues = {
          ...formData,
          attachments: fileList
        }
        await onSubmit?.(updatedValues)
      }
    }

    const handleChange: UploadProps['onChange'] = ({
      fileList: newFileList
    }) => {
      setFileList(newFileList)
      setValue('attachments', newFileList)
    }

    return (
      <>
        <StyledForm onFinish={() => {}} layout="vertical">
          <StyledSteps
            current={currentStep}
            items={steps.map((step) => ({ title: step.title }))}
            labelPlacement="vertical"
          />
          <S.TicketRegistrationFormContent>
            <BasicDataStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
            />
            <ParticipantsStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 1}
              participantOptions={PARTICIPANT_OPTIONS}
            />
            <MessageStep
              control={control}
              errors={errors}
              setValue={setValue}
              fileList={fileList}
              setFileList={setFileList}
              visible={currentStep === 2}
              handleChange={handleChange}
            />
          </S.TicketRegistrationFormContent>
          <S.TicketRegistrationFormFooter>
            {currentStep > 0 && (
              <StyledButton onClick={prevStep}>Voltar</StyledButton>
            )}
            {currentStep < steps.length - 1 && (
              <StyledButton
                type="primary"
                onClick={nextStep}
                loading={loading}
                disabled={!areRequiredFieldsValid() || loading}
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
                Criar Ticket
              </StyledButton>
            )}
          </S.TicketRegistrationFormFooter>
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

TicketRegistrationForm.displayName = 'TicketRegistrationForm'

export default TicketRegistrationForm

interface ITicketRegistrationStep {
  control: any
  errors: any
  setValue: any
  visible: boolean
  participantOptions?: { label: string; value: string }[]
  fileList?: UploadFile[]
  setFileList?: React.Dispatch<React.SetStateAction<UploadFile[]>>
  handleChange?: UploadProps['onChange']
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible
}: ITicketRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Título"
            help={errors.title?.message}
            validateStatus={errors.title ? 'error' : ''}
          >
            <Input
              {...field}
              placeholder="Digite o título do ticket"
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
            label="Descrição"
            help={errors.description?.message}
            validateStatus={errors.description ? 'error' : ''}
          >
            <TextArea
              {...field}
              rows={4}
              placeholder="Digite a descrição do ticket"
              value={field.value}
              onChange={(e) => setValue('description', e.target.value)}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const ParticipantsStep = ({
  control,
  errors,
  setValue,
  visible,
  participantOptions
}: ITicketRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="participants"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Participantes"
            help={errors.participants?.message}
            validateStatus={errors.participants ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione os participantes"
              options={participantOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => setValue('participants', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const MessageStep = ({
  control,
  errors,
  setValue,
  fileList,
  setFileList,
  visible,
  handleChange
}: ITicketRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="initialMessage"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Mensagem Inicial (opcional)"
            help={errors.initialMessage?.message}
            validateStatus={errors.initialMessage ? 'error' : ''}
          >
            <TextArea
              {...field}
              rows={4}
              placeholder="Digite a mensagem inicial"
              value={field.value}
              onChange={(e) => setValue('initialMessage', e.target.value)}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="attachments"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Anexos (opcional)"
            help={errors.attachments?.message}
            validateStatus={errors.attachments ? 'error' : ''}
          >
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList?.([...(fileList || []), file])
                return false
              }}
              onChange={handleChange}
              onRemove={(file) => {
                const newFileList =
                  fileList?.filter((item) => item.uid !== file.uid) || []
                setFileList?.(newFileList)
                setValue('attachments', newFileList)
              }}
            >
              <Button icon={<UploadOutlined />}>Anexar</Button>
            </Upload>
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}
