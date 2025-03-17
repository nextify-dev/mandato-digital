import React, { forwardRef, Ref, useEffect, useState } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, Input, message } from 'antd'
import { StyledForm, StyledButton, StyledSteps } from '@/utils/styles/antd'
import {
  CityStatus,
  getCityRegistrationSchema,
  CityRegistrationFormType,
  getCityStatusData
} from '@/@types/city'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import { DynamicDescriptions, ConfirmModal } from '@/components'
import { ibgeService, IBGEState, IBGECity } from '@/services/ibge'
import { DynamicDescriptionsField } from '@/components/DynamicDescriptions'
import { useUsers } from '@/contexts/UsersProvider'
import { getRoleData, User, UserRole } from '@/@types/user'
import { citiesService } from '@/services/cities'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface CityRegistrationFormTypeExtended extends CityRegistrationFormType {
  administratorId?: string | null
  mayorId?: string | null
  vereadorIds?: string[]
  caboEleitoralIds?: string[]
}

interface CityRegistrationFormProps {
  onSubmit?: (data: CityRegistrationFormTypeExtended) => Promise<void>
  initialData?: Partial<CityRegistrationFormTypeExtended>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

const CityRegistrationForm = forwardRef<
  UseFormReturn<CityRegistrationFormTypeExtended>,
  CityRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, currentStep, setCurrentStep },
    ref: Ref<UseFormReturn<CityRegistrationFormTypeExtended>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const [states, setStates] = useState<IBGEState[]>([])
    const [cities, setCities] = useState<IBGECity[]>([])
    const [isCitiesLoading, setIsCitiesLoading] = useState(false)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [roleChangeField, setRoleChangeField] = useState<
      keyof CityRegistrationFormTypeExtended | null
    >(null)
    const [userOptions, setUserOptions] = useState<
      { label: string; value: string }[]
    >([])
    const { users, voters } = useUsers()

    const defaultValues: DefaultValues<CityRegistrationFormTypeExtended> = {
      name: undefined,
      state: '',
      status: CityStatus.ATIVA,
      ibgeCode: null,
      observations: null,
      administratorId: null,
      mayorId: null,
      vereadorIds: [],
      caboEleitoralIds: []
    }

    const formMethods = useModalForm<CityRegistrationFormTypeExtended>({
      schema: getCityRegistrationSchema(mode === 'viewOnly' ? 'create' : mode),
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

    // Resetar o formulário com initialData quando ele mudar
    useEffect(() => {
      if (initialData) {
        reset({
          ...defaultValues,
          ...initialData,
          name: initialData.name || undefined,
          state: initialData.state || '',
          status: initialData.status || CityStatus.ATIVA,
          ibgeCode: initialData.ibgeCode || null,
          observations: initialData.observations || null,
          administratorId: initialData.administratorId || null,
          mayorId: initialData.mayorId || null,
          vereadorIds: initialData.vereadorIds || [],
          caboEleitoralIds: initialData.caboEleitoralIds || []
        })
      }
    }, [initialData, reset])

    const formData = watch()
    const selectedState = watch('state')

    useEffect(() => {
      const fetchStates = async () => {
        const stateData = await ibgeService.getStates()
        setStates(stateData)
      }
      fetchStates()
    }, [])

    useEffect(() => {
      const fetchCities = async () => {
        if (selectedState && mode === 'create') {
          setIsCitiesLoading(true)
          const cityData = await ibgeService.getCitiesByState(selectedState)
          setCities(cityData)
          setIsCitiesLoading(false)
        }
      }
      fetchCities()
    }, [selectedState, mode])

    useEffect(() => {
      const fetchUserOptions = async () => {
        const options = await Promise.all(
          [...users, ...voters].map(async (user) => {
            const cities = await citiesService.getCities({})
            const city = cities.find((c) => c.id === user.cityId)
            return {
              label: `${user.profile?.nomeCompleto || 'Sem Nome'} - ${
                city?.name || 'N/A'
              }, ${city?.state || 'N/A'}`,
              value: user.id
            }
          })
        )
        setUserOptions(options)
      }
      fetchUserOptions()
    }, [users, voters])

    const handleStateChange = async (state: string) => {
      setValue('state', state)
      setValue('name', '')
      await trigger('state')
    }

    const handleCityChange = async (cityName: string) => {
      setValue('name', cityName)
      const city = cities.find((c) => c.nome === cityName)
      if (city) setValue('ibgeCode', city.id.toString())
      await trigger('name')
    }

    const getFieldLabel = (field: keyof CityRegistrationFormTypeExtended) => {
      switch (field) {
        case 'administratorId':
          return 'Administrador da Cidade'
        case 'mayorId':
          return 'Prefeito'
        case 'vereadorIds':
          return 'Vereador'
        case 'caboEleitoralIds':
          return 'Cabo Eleitoral'
        default:
          return ''
      }
    }

    const handleRoleChange = async (
      field: keyof CityRegistrationFormTypeExtended,
      value: string | string[]
    ) => {
      const userId = Array.isArray(value) ? value[value.length - 1] : value
      const allUsers = [...users, ...voters]
      const user = allUsers.find((u) => u.id === userId)

      if (!user) {
        setValue(field, value)
        return
      }

      const currentFields: (keyof CityRegistrationFormTypeExtended)[] = [
        'administratorId',
        'mayorId',
        'vereadorIds',
        'caboEleitoralIds'
      ]
      let existingField: keyof CityRegistrationFormTypeExtended | null = null

      for (const currentField of currentFields) {
        if (currentField === field) continue
        const fieldValue = formData[currentField]
        if (
          (typeof fieldValue === 'string' && fieldValue === user.id) ||
          (Array.isArray(fieldValue) && fieldValue.includes(user.id))
        ) {
          existingField = currentField
          break
        }
      }

      if (user.role !== UserRole.ELEITOR || existingField) {
        setSelectedUser(user)
        setRoleChangeField(field)
        setIsConfirmModalOpen(true)
      } else {
        removeUserFromOtherFields(user.id, field)
        setValue(field, value)
      }
    }

    const removeUserFromOtherFields = (
      userId: string,
      excludeField: keyof CityRegistrationFormTypeExtended
    ) => {
      const fields: (keyof CityRegistrationFormTypeExtended)[] = [
        'administratorId',
        'mayorId',
        'vereadorIds',
        'caboEleitoralIds'
      ]

      fields.forEach((field) => {
        if (field !== excludeField) {
          const currentValue = formData[field]
          if (field === 'administratorId' || field === 'mayorId') {
            if (currentValue === userId) {
              setValue(field, null)
            }
          } else if (field === 'vereadorIds' || field === 'caboEleitoralIds') {
            const currentArray = currentValue as string[] | undefined
            if (currentArray?.includes(userId)) {
              setValue(
                field,
                currentArray.filter((id) => id !== userId)
              )
            }
          }
        }
      })
    }

    const confirmRoleChange = async () => {
      if (selectedUser && roleChangeField) {
        const newValue =
          roleChangeField === 'administratorId' || roleChangeField === 'mayorId'
            ? selectedUser.id
            : [
                ...((formData[roleChangeField] as string[]) || []),
                selectedUser.id
              ]

        removeUserFromOtherFields(selectedUser.id, roleChangeField)
        setValue(roleChangeField, newValue)

        messageApi.info(
          `Cargo de ${
            selectedUser.profile?.nomeCompleto
          } será atualizado para ${getFieldLabel(
            roleChangeField
          )} ao salvar o formulário.`
        )
        setIsConfirmModalOpen(false)
        setSelectedUser(null)
        setRoleChangeField(null)
      }
    }

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['state', 'name', 'status'],
        requiredFields:
          mode === 'edit' ? ['status'] : ['state', 'name', 'status']
      },
      {
        title: 'Cargos',
        fields: [
          'administratorId',
          'mayorId',
          'vereadorIds',
          'caboEleitoralIds'
        ],
        requiredFields: []
      },
      {
        title: 'Detalhes',
        fields: ['ibgeCode', 'observations'],
        requiredFields: []
      },
      { title: 'Revisão', fields: [], requiredFields: [] }
    ]

    const areRequiredFieldsValid = () => {
      const currentStepRequiredFields = steps[currentStep].requiredFields
      return currentStepRequiredFields.every((field) => {
        const value = formData[field as keyof CityRegistrationFormTypeExtended]
        const hasError =
          !!errors[field as keyof CityRegistrationFormTypeExtended]
        return value && !hasError
      })
    }

    const validateStep = async () => {
      const fieldsToValidate = steps[currentStep]
        .fields as (keyof CityRegistrationFormTypeExtended)[]
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

    const descriptionFields: DynamicDescriptionsField<CityRegistrationFormTypeExtended>[] =
      [
        { key: 'name', label: 'Nome da Cidade' },
        { key: 'state', label: 'Estado' },
        {
          key: 'status',
          label: 'Status',
          render: (value: CityStatus) => getCityStatusData(value).label
        },
        {
          key: 'administratorId',
          label: 'Administrador',
          render: (value) =>
            [...users, ...voters].find((u) => u.id === value)?.profile
              ?.nomeCompleto || '-'
        },
        {
          key: 'mayorId',
          label: 'Prefeito',
          render: (value) =>
            [...users, ...voters].find((u) => u.id === value)?.profile
              ?.nomeCompleto || '-'
        },
        {
          key: 'vereadorIds',
          label: 'Vereadores',
          render: (value: string[]) =>
            value
              ?.map(
                (id) =>
                  [...users, ...voters].find((u) => u.id === id)?.profile
                    ?.nomeCompleto
              )
              .join(', ') || '-'
        },
        {
          key: 'caboEleitoralIds',
          label: 'Cabos Eleitorais',
          render: (value: string[]) =>
            value
              ?.map(
                (id) =>
                  [...users, ...voters].find((u) => u.id === id)?.profile
                    ?.nomeCompleto
              )
              .join(', ') || '-'
        },
        { key: 'ibgeCode', label: 'Código IBGE', render: (v) => v ?? '-' },
        { key: 'observations', label: 'Observações' }
      ]

    const renderViewOnlyMode = () => (
      <DynamicDescriptions
        data={initialData ?? {}}
        fields={descriptionFields}
        title="Detalhes da Cidade"
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
          <S.CityRegistrationFormContent>
            <BasicDataStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
              mode={mode}
              states={states}
              cities={cities}
              isCitiesLoading={isCitiesLoading}
              onStateChange={handleStateChange}
              onCityChange={handleCityChange}
              selectedState={!!selectedState}
            />
            <RolesStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 1}
              userOptions={userOptions}
              onRoleChange={handleRoleChange}
            />
            <DetailsStep
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
          </S.CityRegistrationFormContent>
          <S.CityRegistrationFormFooter>
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
                {mode === 'edit' ? 'Atualizar Cidade' : 'Criar Cidade'}
              </StyledButton>
            )}
          </S.CityRegistrationFormFooter>

          <ConfirmModal
            type="warning"
            title="Confirmação de Alteração de Cargo"
            content={
              selectedUser && roleChangeField
                ? (() => {
                    const currentFields: (keyof CityRegistrationFormTypeExtended)[] =
                      [
                        'administratorId',
                        'mayorId',
                        'vereadorIds',
                        'caboEleitoralIds'
                      ]
                    const existingField = currentFields.find(
                      (field) =>
                        field !== roleChangeField &&
                        (formData[field] === selectedUser.id ||
                          (Array.isArray(formData[field]) &&
                            (formData[field] as string[]).includes(
                              selectedUser.id
                            )))
                    )

                    if (existingField) {
                      return `Você havia selecionado o usuário ${
                        selectedUser.profile?.nomeCompleto
                      } para o cargo de ${getFieldLabel(
                        existingField
                      )}. Deseja alterar para o cargo de ${getFieldLabel(
                        roleChangeField
                      )}?`
                    } else {
                      return `O usuário ${
                        selectedUser.profile?.nomeCompleto
                      } já possui o cargo de ${
                        getRoleData(selectedUser.role).label
                      }. Deseja alterar seu cargo para ${getFieldLabel(
                        roleChangeField
                      )}? A cidade atual ficará sem esse cargo preenchido por este usuário.`
                    }
                  })()
                : ''
            }
            visible={isConfirmModalOpen}
            onConfirm={confirmRoleChange}
            onCancel={() => {
              setIsConfirmModalOpen(false)
              setSelectedUser(null)
              setRoleChangeField(null)
            }}
            confirmText="Sim"
            cancelText="Não"
          />
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

CityRegistrationForm.displayName = 'CityRegistrationForm'

interface ICityRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  visible: boolean
  mode?: FormMode
  states?: IBGEState[]
  cities?: IBGECity[]
  isCitiesLoading?: boolean
  onStateChange?: (state: string) => void
  onCityChange?: (city: string) => void
  onRoleChange?: (
    field: keyof CityRegistrationFormTypeExtended,
    value: string | string[]
  ) => void
  descriptionFields?: DynamicDescriptionsField<CityRegistrationFormTypeExtended>[]
  selectedState?: boolean
  users?: User[]
  userOptions?: { label: string; value: string }[] // Adicionado para suportar opções assíncronas
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible,
  mode,
  states,
  cities,
  isCitiesLoading,
  onStateChange,
  onCityChange,
  selectedState
}: ICityRegistrationStep) => {
  const CITY_STATUS_OPTIONS = Object.values(CityStatus).map((status) => ({
    label: getCityStatusData(status).label,
    value: status
  }))

  return (
    <FormStep visible={visible ? 1 : 0}>
      <FormInputsWrapper>
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Estado"
              help={errors.state?.message}
              validateStatus={errors.state ? 'error' : ''}
              style={{ width: '15%' }}
            >
              <Select
                {...field}
                placeholder="Selecione o estado"
                options={states?.map((state) => ({
                  label: state.sigla,
                  value: state.sigla
                }))}
                onChange={(value) => onStateChange!(value)}
                value={field.value}
                disabled={mode === 'edit'}
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Cidade"
              help={errors.name?.message}
              validateStatus={errors.name ? 'error' : ''}
              style={{ width: '55%' }}
            >
              <Select
                {...field}
                placeholder="Selecione a cidade"
                options={cities?.map((city) => ({
                  label: city.nome,
                  value: city.nome
                }))}
                onChange={(value) => onCityChange!(value)}
                value={field.value}
                disabled={mode === 'edit' || !selectedState}
                loading={isCitiesLoading}
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
              style={{ width: '30%' }}
            >
              <Select
                {...field}
                placeholder="Selecione o status"
                options={CITY_STATUS_OPTIONS}
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

const RolesStep = ({
  control,
  errors,
  setValue,
  visible,
  userOptions,
  onRoleChange
}: ICityRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="administratorId"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Administrador da Cidade"
            help={errors.administratorId?.message}
            validateStatus={errors.administratorId ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione um administrador"
              options={userOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => onRoleChange!('administratorId', value)}
              value={field.value}
              allowClear
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="mayorId"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Prefeito"
            help={errors.mayorId?.message}
            validateStatus={errors.mayorId ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione um prefeito"
              options={userOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => onRoleChange!('mayorId', value)}
              value={field.value}
              allowClear
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="vereadorIds"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Vereadores"
            help={errors.vereadorIds?.message}
            validateStatus={errors.vereadorIds ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione os vereadores"
              options={userOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => onRoleChange!('vereadorIds', value)}
              value={field.value}
              allowClear
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="caboEleitoralIds"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Cabos Eleitorais"
            help={errors.caboEleitoralIds?.message}
            validateStatus={errors.caboEleitoralIds ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione os cabos eleitorais"
              options={userOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => onRoleChange!('caboEleitoralIds', value)}
              value={field.value}
              allowClear
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
  visible
}: ICityRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
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
              placeholder="Digite observações sobre a cidade"
              value={field.value || ''}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="ibgeCode"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Código IBGE (opcional)"
            help={errors.ibgeCode?.message}
            validateStatus={errors.ibgeCode ? 'error' : ''}
          >
            <Input
              {...field}
              placeholder="Digite o código IBGE"
              value={field.value || ''}
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
}: ICityRegistrationStep) => (
  <FormStep visible={visible ? 1 : 0}>
    <DynamicDescriptions data={formData} fields={descriptionFields || []} />
  </FormStep>
)

export default CityRegistrationForm
