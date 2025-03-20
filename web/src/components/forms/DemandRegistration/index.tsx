// src/components/forms/DemandRegistrationForm/index.tsx

import React, { forwardRef, Ref, useEffect, useCallback, useState } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, Button, Input, message } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import {
  StyledForm,
  StyledButton,
  StyledSteps,
  StyledUpload
} from '@/utils/styles/antd'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  DemandStatus,
  getDemandRegistrationSchema,
  DemandRegistrationFormType,
  getDemandStatusData
} from '@/@types/demand'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'
import { useUsers } from '@/contexts/UsersProvider'
import { useAuth } from '@/contexts/AuthProvider'
import FileListDisplay from '@/components/FileListDisplay'
import { UploadFile, UploadProps } from 'antd/lib/upload/interface'
import { useCities } from '@/contexts/CitiesProvider'
import { RcFile } from 'antd/es/upload'
import { UserRole } from '@/@types/user'
import { getRoleData } from '@/@types/user'
import {
  uploadFilesToStorage,
  getTypeLabel,
  urlToRcFile
} from '@/utils/functions/storageUtils'
import {
  FileCard,
  FileDetails,
  FileDetailsName,
  FileDetailsType,
  FileOptions,
  FilePreview
} from '@/components/FileListDisplay/styles'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface DemandRegistrationFormProps {
  onSubmit?: (data: DemandRegistrationFormType) => Promise<void>
  initialData?: Partial<DemandRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  loading?: boolean
}

const DemandRegistrationForm = forwardRef<
  UseFormReturn<DemandRegistrationFormType>,
  DemandRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, currentStep, setCurrentStep, loading },
    ref: Ref<UseFormReturn<DemandRegistrationFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const { user } = useAuth()
    const { users, voters, allUsers, loading: usersLoading } = useUsers()
    const { cities } = useCities()
    const [fileList, setFileList] = useState<UploadFile[]>([])

    const defaultValues: DefaultValues<DemandRegistrationFormType> = {
      voterId: '',
      cityId:
        user?.role === UserRole.ADMINISTRADOR_GERAL ? '' : user?.cityId || '',
      description: '',
      status: DemandStatus.NOVA,
      relatedUserId: '',
      documents: null
    }

    const formMethods = useModalForm<DemandRegistrationFormType>({
      schema: getDemandRegistrationSchema(
        mode === 'viewOnly' ? 'create' : mode
      ),
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
    }, [initialData, mode, setValue, messageApi])

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
      label: `${user.profile?.nomeCompleto} (${getRoleData(user.role).label})`,
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
            ? ['voterId', 'cityId', 'status']
            : ['voterId', 'status'],
        requiredFields:
          mode === 'edit'
            ? ['status']
            : user?.role === UserRole.ADMINISTRADOR_GERAL
            ? ['voterId', 'cityId', 'status']
            : ['voterId', 'status']
      },
      {
        title: 'Detalhes',
        fields: ['description', 'relatedUserId'],
        requiredFields: ['description', 'relatedUserId']
      },
      {
        title: 'Documentos',
        fields: ['documents'],
        requiredFields: []
      },
      { title: 'Revisão', fields: [], requiredFields: [] }
    ]

    const areRequiredFieldsValid = useCallback(
      (stepIndex: number) => {
        const requiredFields = steps[stepIndex].requiredFields
        return requiredFields.every((field) => {
          const value = formData[field as keyof DemandRegistrationFormType]
          const hasError = !!errors[field as keyof DemandRegistrationFormType]
          return value !== undefined && value !== '' && !hasError
        })
      },
      [formData, errors]
    )

    const validateStep = useCallback(
      async (stepIndex: number) => {
        const fieldsToValidate = steps[stepIndex]
          .fields as (keyof DemandRegistrationFormType)[]
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

    const descriptionFields: DynamicDescriptionsField<DemandRegistrationFormType>[] =
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
        {
          key: 'status',
          label: 'Status',
          render: (value: DemandStatus) => getDemandStatusData(value).label
        },
        { key: 'description', label: 'Descrição' },
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
        }
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
          <S.DemandRegistrationFormContent>
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
            <DocumentsStep
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
              initialData={initialData}
            />
          </S.DemandRegistrationFormContent>
          <S.DemandRegistrationFormFooter>
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
                {mode === 'edit' ? 'Atualizar Demanda' : 'Criar Demanda'}
              </StyledButton>
            )}
          </S.DemandRegistrationFormFooter>
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

DemandRegistrationForm.displayName = 'DemandRegistrationForm'

export default DemandRegistrationForm

interface IDemandRegistrationStep {
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
  descriptionFields?: DynamicDescriptionsField<DemandRegistrationFormType>[]
  fileList?: UploadFile[]
  setFileList?: React.Dispatch<React.SetStateAction<UploadFile[]>>
  isAdminGeral?: boolean
  initialData?: Partial<DemandRegistrationFormType>
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
}: IDemandRegistrationStep) => {
  const DEMAND_STATUS_OPTIONS = Object.values(DemandStatus).map((status) => ({
    label: getDemandStatusData(status).label,
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
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Status"
            help={errors.status?.message}
            validateStatus={errors.status ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione o status"
              options={DEMAND_STATUS_OPTIONS}
              onChange={(value) => setValue('status', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
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
}: IDemandRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Descrição da Demanda"
            help={errors.description?.message}
            validateStatus={errors.description ? 'error' : ''}
          >
            <TextArea
              {...field}
              rows={6}
              placeholder="Digite a descrição da demanda"
              value={field.value}
              onChange={(e) => setValue('description', e.target.value)}
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

const DocumentsStep = ({
  control,
  errors,
  setValue,
  setFileList,
  fileList,
  visible,
  mode
}: IDemandRegistrationStep) => {
  const [messageApi, contextHolder] = message.useMessage()

  const handleUpload: UploadProps['customRequest'] = async ({
    file,
    onSuccess,
    onError,
    onProgress
  }) => {
    const uid = (file as UploadFile).uid
    const fileName = (file as File).name

    setFileList?.((prev) =>
      prev.map((item) =>
        item.uid === uid ? { ...item, status: 'uploading', percent: 0 } : item
      )
    )

    try {
      for (let percent = 0; percent <= 100; percent += 10) {
        onProgress?.({ percent })
        setFileList?.((prev) =>
          prev.map((item) => (item.uid === uid ? { ...item, percent } : item))
        )
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      const tempPath = `temp/uploads/${uid}_${fileName}`
      const [downloadUrl] = await uploadFilesToStorage(tempPath, [
        file as RcFile
      ])

      setFileList?.((prev) =>
        prev.map((item) =>
          item.uid === uid
            ? {
                ...item,
                status: 'done',
                percent: 100,
                url: downloadUrl,
                thumbUrl: downloadUrl
              }
            : item
        )
      )

      setValue('documents', fileList)
      onSuccess?.(null, new XMLHttpRequest())
      // messageApi.success(`Arquivo "${fileName}" carregado com sucesso!`)
    } catch (error) {
      setFileList?.((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, status: 'error', percent: 0 } : item
        )
      )
      onError?.(error as Error)
      messageApi.error(
        `Erro ao carregar o arquivo "${fileName}". Tente novamente.`
      )
    }
  }

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList?.filter((item) => item.uid !== file.uid) || []
    setFileList?.(newFileList)
    setValue('documents', newFileList)
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList?.(newFileList)
    setValue('documents', newFileList)
  }

  const renderFilePreview = (file: UploadFile) => {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'desconhecido'
    const type = file.type || 'other'

    if (type === 'image' && file.url) {
      return (
        <img
          src={file.url}
          alt={file.name}
          style={{ width: 50, height: 50, objectFit: 'cover' }}
        />
      )
    } else if (type === 'video' && file.url) {
      return (
        <video controls muted style={{ width: 50, height: 50 }}>
          <source src={file.url} type={`video/${extension}`} />
        </video>
      )
    } else {
      return <span style={{ fontSize: 12, color: '#888' }}>.{extension}</span>
    }
  }

  return (
    <FormStep visible={visible ? 1 : 0}>
      {contextHolder}
      <Controller
        name="documents"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Documentos (opcional)"
            help={errors.documents?.message}
            validateStatus={errors.documents ? 'error' : ''}
          >
            <StyledUpload
              listType="picture"
              multiple
              customRequest={handleUpload}
              onChange={handleChange}
              fileList={fileList || []}
              disabled={mode === 'viewOnly'}
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: false
              }}
              itemRender={(originNode, file, fileList) => (
                <FileCard>
                  <FilePreview style={{ marginRight: 8 }}>
                    {renderFilePreview(file)}
                  </FilePreview>
                  <FileDetails>
                    <FileDetailsName>{file.name}</FileDetailsName>
                    <FileDetailsType>
                      <b>Tipo do Arquivo:</b> {getTypeLabel(file.type)}
                    </FileDetailsType>
                  </FileDetails>
                  <FileOptions>
                    {mode !== 'viewOnly' && (
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleRemove(file)}
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </FileOptions>
                </FileCard>
              )}
            >
              <Button icon={<UploadOutlined />} disabled={mode === 'viewOnly'}>
                Anexar Documentos
              </Button>
            </StyledUpload>
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
  descriptionFields,
  initialData
}: IDemandRegistrationStep) => (
  <FormStep visible={visible ? 1 : 0}>
    <DynamicDescriptions data={formData} fields={descriptionFields || []} />
    <FileListDisplay files={formData?.documents || []} viewOnly />
  </FormStep>
)
