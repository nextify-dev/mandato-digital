// src/components/forms/VisitRegistrationForm/index.tsx

import React, { forwardRef, Ref, useEffect, useState } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, DatePicker, Upload, Button, Input, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import moment from 'moment'
import { StyledForm, StyledButton, StyledSteps } from '@/utils/styles/antd'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  VisitStatus,
  getVisitRegistrationSchema,
  VisitRegistrationFormType,
  getVisitStatusData
} from '@/@types/visit'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'
import { useUsers } from '@/contexts/UsersProvider'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface VisitRegistrationFormProps {
  onSubmit?: (data: VisitRegistrationFormType) => Promise<void>
  initialData?: Partial<VisitRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

const VisitRegistrationForm = forwardRef<
  UseFormReturn<VisitRegistrationFormType>,
  VisitRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, currentStep, setCurrentStep },
    ref: Ref<UseFormReturn<VisitRegistrationFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const { voters, allUsers, loading: usersLoading } = useUsers()

    const defaultValues: DefaultValues<VisitRegistrationFormType> = {
      voterId: '',
      dateTime: '',
      status: VisitStatus.AGENDADA,
      reason: '',
      relatedUserId: '',
      documents: null,
      observations: null
    }

    const formMethods = useModalForm<VisitRegistrationFormType>({
      schema: getVisitRegistrationSchema(mode === 'viewOnly' ? 'create' : mode),
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
      if (initialData) {
        reset({
          ...defaultValues,
          ...initialData,
          voterId: initialData.voterId || '',
          dateTime: initialData.dateTime || '',
          status: initialData.status || VisitStatus.AGENDADA,
          reason: initialData.reason || '',
          relatedUserId: initialData.relatedUserId || '',
          documents: initialData.documents || null,
          observations: initialData.observations || null
        })
      }
    }, [initialData, reset])

    const formData = watch()

    const VOTER_OPTIONS = voters.map((voter) => ({
      label: `${voter.profile?.nomeCompleto} (${voter.email})`,
      value: voter.id
    }))

    const USER_OPTIONS = allUsers.map((user) => ({
      label: `${user.profile?.nomeCompleto} (${user.role})`,
      value: user.id
    }))

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['voterId', 'dateTime', 'status'],
        requiredFields:
          mode === 'edit' ? ['status'] : ['voterId', 'dateTime', 'status']
      },
      {
        title: 'Detalhes',
        fields: ['reason', 'relatedUserId'],
        requiredFields: ['reason', 'relatedUserId']
      },
      {
        title: 'Complementos',
        fields: ['documents', 'observations'],
        requiredFields: []
      },
      { title: 'Revisão', fields: [], requiredFields: [] }
    ]

    const areRequiredFieldsValid = () => {
      const currentStepRequiredFields = steps[currentStep].requiredFields
      return currentStepRequiredFields.every((field) => {
        const value = formData[field as keyof VisitRegistrationFormType]
        const hasError = !!errors[field as keyof VisitRegistrationFormType]
        return value && !hasError
      })
    }

    const validateStep = async () => {
      const fieldsToValidate = steps[currentStep]
        .fields as (keyof VisitRegistrationFormType)[]
      return await trigger(fieldsToValidate, { shouldFocus: true })
    }

    const nextStep = async () => {
      if ((await validateStep()) && areRequiredFieldsValid()) {
        setCurrentStep((prev) => prev + 1)
      }
    }

    const prevStep = () => setCurrentStep((prev) => prev - 1)

    const handleSubmitClick = async () => {
      if ((await validateStep()) && areRequiredFieldsValid()) {
        formMethods.handleSubmit(onSubmit!)()
      }
    }

    const descriptionFields: DynamicDescriptionsField<VisitRegistrationFormType>[] =
      [
        {
          key: 'voterId',
          label: 'Eleitor',
          render: (value) =>
            allUsers.find((u) => u.id === value)?.profile?.nomeCompleto ||
            value ||
            '-'
        },
        { key: 'dateTime', label: 'Data e Horário' },
        {
          key: 'status',
          label: 'Status',
          render: (value: VisitStatus) => getVisitStatusData(value).label
        },
        { key: 'reason', label: 'Motivo' },
        {
          key: 'relatedUserId',
          label: 'Vinculado a',
          render: (value) =>
            allUsers.find((u) => u.id === value)?.profile?.nomeCompleto ||
            value ||
            '-'
        },
        {
          key: 'documents',
          label: 'Documentos',
          render: (value: File[] | null) =>
            value && value.length > 0 ? `${value.length} anexos` : '-'
        },
        { key: 'observations', label: 'Observações', render: (v) => v ?? '-' }
      ]

    const renderViewOnlyMode = () => (
      <DynamicDescriptions
        data={initialData ?? {}}
        fields={descriptionFields}
        title="Detalhes da Visita"
      />
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
          <S.VisitRegistrationFormContent>
            <BasicDataStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
              mode={mode}
              voterOptions={VOTER_OPTIONS}
              usersLoading={usersLoading}
            />
            <DetailsStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 1}
              userOptions={USER_OPTIONS}
              usersLoading={usersLoading}
            />
            <ComplementsStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 2}
            />
            <ReviewStep
              control={control}
              errors={errors}
              formData={formData}
              setValue={setValue}
              visible={currentStep === 3}
              descriptionFields={descriptionFields}
            />
          </S.VisitRegistrationFormContent>
          <S.VisitRegistrationFormFooter>
            {currentStep > 0 && (
              <StyledButton onClick={prevStep}>Voltar</StyledButton>
            )}
            {currentStep < steps.length - 1 && (
              <StyledButton
                type="primary"
                onClick={nextStep}
                disabled={!areRequiredFieldsValid()}
              >
                Próximo
              </StyledButton>
            )}
            {currentStep === steps.length - 1 && (
              <StyledButton
                type="primary"
                onClick={handleSubmitClick}
                disabled={!isValid}
              >
                {mode === 'edit' ? 'Atualizar Visita' : 'Criar Visita'}
              </StyledButton>
            )}
          </S.VisitRegistrationFormFooter>
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

VisitRegistrationForm.displayName = 'VisitRegistrationForm'

interface IVisitRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  visible: boolean
  mode?: FormMode
  voterOptions?: { label: string; value: string }[]
  userOptions?: { label: string; value: string }[]
  usersLoading?: boolean
  descriptionFields?: DynamicDescriptionsField<VisitRegistrationFormType>[]
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible,
  mode,
  voterOptions,
  usersLoading
}: IVisitRegistrationStep) => {
  const VISIT_STATUS_OPTIONS = Object.values(VisitStatus).map((status) => ({
    label: getVisitStatusData(status).label,
    value: status
  }))

  return (
    <FormStep visible={visible ? 1 : 0}>
      <FormInputsWrapper>
        <Controller
          name="voterId"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Eleitor"
              help={errors.voterId?.message}
              validateStatus={errors.voterId ? 'error' : ''}
              style={{ width: '50%' }}
            >
              <Select
                {...field}
                placeholder="Selecione o eleitor"
                options={voterOptions}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(value) => setValue('voterId', value)}
                value={field.value}
                disabled={mode === 'edit'}
                loading={usersLoading}
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="dateTime"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Data e Horário"
              help={errors.dateTime?.message}
              validateStatus={errors.dateTime ? 'error' : ''}
              style={{ width: '30%' }}
            >
              <DatePicker
                format="DD/MM/YYYY HH:mm"
                showTime={{ format: 'HH:mm' }}
                onChange={(date) =>
                  setValue(
                    'dateTime',
                    date ? date.format('DD/MM/YYYY HH:mm') : ''
                  )
                }
                value={
                  field.value ? moment(field.value, 'DD/MM/YYYY HH:mm') : null
                }
                disabled={mode === 'edit'}
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Status"
              help={errors.status?.message}
              validateStatus={errors.status ? 'error' : ''}
              style={{ width: '20%' }}
            >
              <Select
                {...field}
                placeholder="Selecione o status"
                options={VISIT_STATUS_OPTIONS}
                onChange={(value) => setValue('status', value)}
                value={field.value}
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
    </FormStep>
  )
}

const DetailsStep = ({
  control,
  errors,
  setValue,
  visible,
  userOptions,
  usersLoading
}: IVisitRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="reason"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Motivo"
            help={errors.reason?.message}
            validateStatus={errors.reason ? 'error' : ''}
          >
            <Input
              {...field}
              placeholder="Digite o motivo da visita"
              value={field.value}
              onChange={(e) => setValue('reason', e.target.value)}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="relatedUserId"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Vinculado a"
            help={errors.relatedUserId?.message}
            validateStatus={errors.relatedUserId ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione o usuário vinculado"
              options={userOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => setValue('relatedUserId', value)}
              value={field.value}
              loading={usersLoading}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const ComplementsStep = ({
  control,
  errors,
  setValue,
  visible
}: IVisitRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="documents"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Documentos (opcional)"
            help={errors.documents?.message}
            validateStatus={errors.documents ? 'error' : ''}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              onChange={({ fileList }) =>
                setValue(
                  'documents',
                  fileList.map((f) => f.originFileObj as File)
                )
              }
              fileList={field.value?.map((file: any, index: number) => ({
                uid: `${index}`,
                name: file.name || `Documento ${index + 1}`,
                status: 'done',
                originFileObj: file.url ? undefined : file,
                url: file.url || undefined
              }))}
            >
              <Button icon={<UploadOutlined />}>Anexar Documentos</Button>
            </Upload>
          </StyledForm.Item>
        )}
      />
      <Controller
        name="observations"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Observações (opcional)"
            help={errors.observations?.message}
            validateStatus={errors.observations ? 'error' : ''}
          >
            <TextArea
              {...field}
              rows={4}
              placeholder="Digite observações sobre a visita"
              value={field.value || ''}
              onChange={(e) => setValue('observations', e.target.value || null)}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const ReviewStep = ({
  control,
  errors,
  formData,
  setValue,
  visible,
  descriptionFields
}: IVisitRegistrationStep) => (
  <FormStep visible={visible ? 1 : 0}>
    <DynamicDescriptions data={formData} fields={descriptionFields || []} />
  </FormStep>
)

export default VisitRegistrationForm
