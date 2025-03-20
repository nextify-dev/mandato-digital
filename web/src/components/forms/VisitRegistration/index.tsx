// src/components/forms/VisitRegistrationForm/index.tsx

import React, { forwardRef, Ref, useEffect, useCallback, useState } from 'react'
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
import { useAuth } from '@/contexts/AuthProvider'
import FileListDisplay from '@/components/FileListDisplay'
import { UploadFile } from 'antd/lib/upload/interface'
import { urlToRcFile } from '@/utils/functions/firebaseUtils'
import { UserRole } from '@/@types/user'
import { useCities } from '@/contexts/CitiesProvider'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface VisitRegistrationFormProps {
  onSubmit?: (data: VisitRegistrationFormType) => Promise<void>
  initialData?: Partial<VisitRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  loading?: boolean
}

const VisitRegistrationForm = forwardRef<
  UseFormReturn<VisitRegistrationFormType>,
  VisitRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, currentStep, setCurrentStep, loading },
    ref: Ref<UseFormReturn<VisitRegistrationFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const { user } = useAuth()
    const { users, voters, allUsers, loading: usersLoading } = useUsers()
    const { cities } = useCities()
    const [fileList, setFileList] = useState<UploadFile[]>([])

    const defaultValues: DefaultValues<VisitRegistrationFormType> = {
      voterId: '',
      cityId:
        user?.role === UserRole.ADMINISTRADOR_GERAL ? '' : user?.cityId || '',
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
      const loadFiles = async () => {
        if (initialData?.documents) {
          const updatedFileList = await Promise.all(
            initialData.documents.map(async (doc, index) => {
              if (doc.url && doc.status === 'done') {
                try {
                  const file = await urlToRcFile(doc.url, doc.name)
                  return {
                    ...doc,
                    originFileObj: file,
                    uid: doc.uid || `rc-upload-${Date.now()}-${index}`,
                    status: 'done' as const,
                    name: doc.name,
                    type: doc.type
                  } as UploadFile
                } catch (error) {
                  console.error(
                    `Erro ao processar o arquivo ${doc.name}:`,
                    error
                  )
                  messageApi.error(
                    `Erro ao processar o arquivo ${doc.name}. Reanexe o arquivo manualmente.`
                  )
                  return doc as UploadFile
                }
              }
              return doc as UploadFile
            })
          )
          setFileList(updatedFileList)
          setValue('documents', updatedFileList)
        } else {
          setFileList([])
          setValue('documents', null)
        }
      }

      if (mode === 'edit' || mode === 'viewOnly') {
        loadFiles()
      }
    }, [initialData, mode, setValue])

    useEffect(() => {
      if (mode === 'create') {
        reset(defaultValues)
        setFileList([])
        setCurrentStep(0)
      } else if (initialData && (mode === 'edit' || mode === 'viewOnly')) {
        reset({ ...defaultValues, ...initialData })
        setCurrentStep(0)
      }
    }, [initialData, mode, reset, setCurrentStep])

    const formData = watch()

    const VOTER_OPTIONS = voters.map((voter) => ({
      label: `${voter.profile?.nomeCompleto} (${voter.email})`,
      value: voter.id
    }))

    const USER_OPTIONS = users.map((user) => ({
      label: `${user.profile?.nomeCompleto} (${user.role})`,
      value: user.id
    }))

    const CITY_OPTIONS = cities.map((city) => ({
      label: city.name,
      value: city.id
    }))

    const steps = [
      {
        title: 'Dados Básicos',
        fields:
          user?.role === UserRole.ADMINISTRADOR_GERAL
            ? ['voterId', 'cityId', 'dateTime', 'status']
            : ['voterId', 'dateTime', 'status'],
        requiredFields:
          mode === 'edit'
            ? ['status']
            : user?.role === UserRole.ADMINISTRADOR_GERAL
            ? ['voterId', 'cityId', 'dateTime', 'status']
            : ['voterId', 'dateTime', 'status']
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

    const areRequiredFieldsValid = useCallback(
      (stepIndex: number) => {
        const requiredFields = steps[stepIndex].requiredFields
        return requiredFields.every((field) => {
          const value = formData[field as keyof VisitRegistrationFormType]
          const hasError = !!errors[field as keyof VisitRegistrationFormType]
          return value !== undefined && value !== '' && !hasError
        })
      },
      [formData, errors]
    )

    const validateStep = useCallback(
      async (stepIndex: number) => {
        const fieldsToValidate = steps[stepIndex]
          .fields as (keyof VisitRegistrationFormType)[]
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
        const updatedValues = {
          ...formData,
          documents: fileList
        }
        await onSubmit?.(updatedValues)
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
        {
          key: 'cityId',
          label: 'Cidade',
          render: (value) =>
            cities.find((city) => city.id === value)?.name || value || '-'
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
          render: (value) =>
            value && value.length > 0 ? `${value.length} anexos` : '-'
        },
        { key: 'observations', label: 'Observações', render: (v) => v ?? '-' }
      ]

    const renderViewOnlyMode = () => (
      <FormStep visible={1}>
        <DynamicDescriptions
          data={initialData ?? {}}
          fields={descriptionFields}
        />
        <FileListDisplay files={initialData?.documents || []} />
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
          <S.VisitRegistrationFormContent>
            <BasicDataStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
              mode={mode}
              voterOptions={VOTER_OPTIONS}
              cityOptions={CITY_OPTIONS}
              usersLoading={usersLoading}
              isAdminGeral={user?.role === UserRole.ADMINISTRADOR_GERAL}
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
              setFileList={setFileList}
              fileList={fileList}
              visible={currentStep === 2}
              mode={mode}
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

export default VisitRegistrationForm

interface IVisitRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  visible: boolean
  mode?: FormMode
  voterOptions?: { label: string; value: string }[]
  cityOptions?: { label: string; value: string }[]
  userOptions?: { label: string; value: string }[]
  usersLoading?: boolean
  descriptionFields?: DynamicDescriptionsField<VisitRegistrationFormType>[]
  fileList?: UploadFile[]
  setFileList?: React.Dispatch<React.SetStateAction<UploadFile[]>>
  isAdminGeral?: boolean
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible,
  mode,
  voterOptions,
  cityOptions,
  usersLoading,
  isAdminGeral
}: IVisitRegistrationStep) => {
  const VISIT_STATUS_OPTIONS = Object.values(VisitStatus).map((status) => ({
    label: getVisitStatusData(status).label,
    value: status
  }))

  return (
    <FormStep visible={visible ? 1 : 0}>
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
      {isAdminGeral && (
        <Controller
          name="cityId"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Cidade"
              help={errors.cityId?.message}
              validateStatus={errors.cityId ? 'error' : ''}
            >
              <Select
                {...field}
                placeholder="Selecione a cidade"
                options={cityOptions}
                onChange={(value) => setValue('cityId', value)}
                value={field.value}
                disabled={mode === 'edit'}
                loading={usersLoading}
              />
            </StyledForm.Item>
          )}
        />
      )}
      <FormInputsWrapper>
        <Controller
          name="dateTime"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Data e Horário"
              help={errors.dateTime?.message}
              validateStatus={errors.dateTime ? 'error' : ''}
              style={{ width: '65%' }}
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
              style={{ width: '35%' }}
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
  setFileList,
  fileList,
  visible,
  mode
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
              onChange={({ fileList }) => {
                setFileList?.(fileList)
                setValue('documents', fileList)
              }}
              fileList={fileList || []}
              disabled={mode === 'viewOnly'}
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
              disabled={mode === 'viewOnly'}
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
