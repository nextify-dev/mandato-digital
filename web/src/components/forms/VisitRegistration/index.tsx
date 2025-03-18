// src/components/forms/VisitRegistrationForm/index.tsx
import React, { forwardRef, Ref, useEffect, useState } from 'react'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, DatePicker, Upload, Button, Input, Steps } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import moment from 'moment'
import { StyledForm, StyledButton, StyledSteps } from '@/utils/styles/antd'
import { FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  VisitReason,
  VisitRegistrationFormType,
  getVisitRegistrationSchema,
  getVisitReasonData,
  FormattedVisitReason
} from '@/@types/visit'
import { useUsers } from '@/contexts/UsersProvider'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'

const { TextArea } = Input

interface VisitRegistrationFormProps {
  onSubmit?: (data: VisitRegistrationFormType) => Promise<void>
  initialData?: Partial<VisitRegistrationFormType>
  mode: 'create' | 'edit' | 'viewOnly'
  onModalClose?: () => void // Nova prop para detectar fechamento do modal
}

const VisitRegistrationForm = forwardRef<
  UseFormReturn<VisitRegistrationFormType>,
  VisitRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, onModalClose },
    ref: Ref<UseFormReturn<VisitRegistrationFormType>>
  ) => {
    const { voters, users, allUsers, loading: usersLoading } = useUsers()
    const [currentStep, setCurrentStep] = useState(0)

    interface ExtendedVisitRegistrationFormType
      extends VisitRegistrationFormType {
      observations?: string | null
    }

    const defaultValues: DefaultValues<ExtendedVisitRegistrationFormType> = {
      voterId: '',
      dateTime: undefined,
      reason: undefined,
      relatedUserId: '',
      documents: null,
      observations: null
    }

    const formMethods = useModalForm<ExtendedVisitRegistrationFormType>({
      schema: getVisitRegistrationSchema(),
      defaultValues,
      onSubmit: onSubmit ? (data) => onSubmit(data) : undefined
    })

    React.useImperativeHandle(
      ref,
      () =>
        ({
          ...formMethods,
          reset: (values) => formMethods.reset(values ?? defaultValues),
          getValues: formMethods.getValues,
          setValue: formMethods.setValue,
          trigger: formMethods.trigger,
          control: formMethods.control,
          formState: formMethods.formState,
          handleSubmit: formMethods.handleSubmit
        } as UseFormReturn<VisitRegistrationFormType>)
    )

    const {
      control,
      setValue,
      reset,
      trigger,
      formState: { errors, isSubmitting, isValid },
      getValues
    } = formMethods

    useEffect(() => {
      if (mode === 'create') {
        reset(defaultValues)
      } else if (mode === 'edit' && initialData) {
        reset({ ...defaultValues, ...initialData })
        trigger()
      }
    }, [mode, initialData, reset])

    // Reset ao fechar o modal
    useEffect(() => {
      return () => {
        if (onModalClose) {
          reset(defaultValues) // Sempre reseta para os valores padrão ao fechar
        }
      }
    }, [onModalClose, reset])

    const VOTER_OPTIONS = voters.map((voter) => ({
      label: `${voter.profile?.nomeCompleto} (${voter.email})`,
      value: voter.id
    }))

    const USER_OPTIONS = users.map((user) => ({
      label: `${user.profile?.nomeCompleto} (${user.role})`,
      value: user.id
    }))

    const REASON_OPTIONS = Object.values(VisitReason).map((reason) => ({
      label: getVisitReasonData(reason).label,
      value: reason
    }))

    const steps = [
      {
        title: 'Dados Principais',
        fields: ['voterId', 'dateTime', 'reason', 'relatedUserId'],
        requiredFields: ['voterId', 'dateTime', 'reason', 'relatedUserId']
      },
      {
        title: 'Detalhes Adicionais',
        fields: ['documents', 'observations'],
        requiredFields: []
      },
      {
        title: 'Revisão',
        fields: [],
        requiredFields: []
      }
    ]

    const descriptionFields: DynamicDescriptionsField<ExtendedVisitRegistrationFormType>[] =
      [
        {
          key: 'voterId',
          label: 'Eleitor',
          render: (value) =>
            allUsers.find((u) => u.id === value)?.profile?.nomeCompleto ||
            value ||
            '-'
        },
        {
          key: 'dateTime',
          label: 'Data e Horário',
          render: (value) => value || '-'
        },
        {
          key: 'reason',
          label: 'Motivo',
          render: (value) =>
            value ? getVisitReasonData(value as VisitReason).label : '-'
        },
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
          render: (value) =>
            Array.isArray(value) && value.length > 0
              ? `${value.length} anexos`
              : 'Nenhum'
        },
        {
          key: 'observations',
          label: 'Observações',
          render: (value) => value || '-'
        }
      ]

    const areRequiredFieldsValid = () => {
      const currentStepRequiredFields = steps[currentStep].requiredFields
      return currentStepRequiredFields.every((field) => {
        const value = getValues(
          field as keyof ExtendedVisitRegistrationFormType
        )
        const hasError =
          !!errors[field as keyof ExtendedVisitRegistrationFormType]
        return value && !hasError
      })
    }

    const validateStep = async () => {
      const fieldsToValidate = steps[currentStep]
        .fields as (keyof ExtendedVisitRegistrationFormType)[]
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
        formMethods.handleSubmit(onSubmit || (() => {}))()
      }
    }

    if (mode === 'viewOnly') {
      return (
        <DynamicDescriptions
          data={initialData ?? {}}
          fields={descriptionFields}
          title="Detalhes da Visita"
        />
      )
    }

    return (
      <StyledForm onFinish={() => {}} layout="vertical">
        <StyledSteps
          current={currentStep}
          items={steps.map((step) => ({ title: step.title }))}
          labelPlacement="vertical"
          style={{ marginLeft: 0 }}
        />
        {/* O restante do JSX permanece igual */}
        <FormStep visible={currentStep === 0 ? 1 : 0}>
          <Controller
            name="voterId"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Eleitor"
                help={errors.voterId?.message}
                validateStatus={errors.voterId ? 'error' : ''}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Pesquise e selecione um eleitor"
                  loading={usersLoading}
                  onChange={(value) => setValue('voterId', value)}
                  value={field.value}
                  options={VOTER_OPTIONS}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
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
                />
              </StyledForm.Item>
            )}
          />

          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Motivo da Visita"
                help={errors.reason?.message}
                validateStatus={errors.reason ? 'error' : ''}
              >
                <Select
                  {...field}
                  placeholder="Selecione o motivo da visita"
                  onChange={(value) => setValue('reason', value)}
                  value={field.value}
                  options={REASON_OPTIONS}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </StyledForm.Item>
            )}
          />

          <Controller
            name="relatedUserId"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Vincular a Usuário"
                help={errors.relatedUserId?.message}
                validateStatus={errors.relatedUserId ? 'error' : ''}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Pesquise e selecione um usuário"
                  loading={usersLoading}
                  onChange={(value) => setValue('relatedUserId', value)}
                  value={field.value}
                  options={USER_OPTIONS}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </StyledForm.Item>
            )}
          />
        </FormStep>

        <FormStep visible={currentStep === 1 ? 1 : 0}>
          <Controller
            name="documents"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Documentos"
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
              <StyledForm.Item label="Observações">
                <TextArea
                  {...field}
                  placeholder="Digite observações adicionais (opcional)"
                  rows={4}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    setValue('observations', e.target.value || null)
                  }
                />
              </StyledForm.Item>
            )}
          />
        </FormStep>

        <FormStep visible={currentStep === 2 ? 1 : 0}>
          <DynamicDescriptions
            data={getValues()}
            fields={descriptionFields}
            title="Revisão dos Dados"
          />
        </FormStep>

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          {currentStep > 0 && (
            <StyledButton style={{ marginRight: 8 }} onClick={prevStep}>
              Voltar
            </StyledButton>
          )}
          {currentStep < steps.length - 1 ? (
            <StyledButton
              type="primary"
              onClick={nextStep}
              disabled={!isValid && currentStep === 0}
            >
              Próximo
            </StyledButton>
          ) : (
            <StyledButton
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={!isValid}
              onClick={handleSubmitClick}
            >
              {mode === 'edit' ? 'Atualizar Visita' : 'Registrar Visita'}
            </StyledButton>
          )}
        </div>
      </StyledForm>
    )
  }
)

VisitRegistrationForm.displayName = 'VisitRegistrationForm'
export default VisitRegistrationForm
