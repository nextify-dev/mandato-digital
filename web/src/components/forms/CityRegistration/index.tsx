// src/components/forms/CityRegistration/index.tsx

import React, { forwardRef, Ref, useEffect, useState } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, Input } from 'antd'
import {
  StyledForm,
  StyledInput,
  StyledButton,
  StyledSteps
} from '@/utils/styles/antd'
import {
  CityStatus,
  getCityRegistrationSchema,
  CityRegistrationFormType,
  getCityStatusData
} from '@/@types/city'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import { DynamicDescriptions } from '@/components'
import { ibgeService, IBGEState, IBGECity } from '@/services/ibge'
import { DynamicDescriptionsField } from '@/components/DynamicDescriptions'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface CityRegistrationFormProps {
  onSubmit?: (data: CityRegistrationFormType) => Promise<void>
  initialData?: Partial<CityRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

const CityRegistrationForm = forwardRef<
  UseFormReturn<CityRegistrationFormType>,
  CityRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, currentStep, setCurrentStep },
    ref: Ref<UseFormReturn<CityRegistrationFormType>>
  ) => {
    const [states, setStates] = useState<IBGEState[]>([])
    const [cities, setCities] = useState<IBGECity[]>([])
    const [isCitiesLoading, setIsCitiesLoading] = useState(false)

    const defaultValues: DefaultValues<CityRegistrationFormType> = {
      name: initialData?.name || undefined,
      state: initialData?.state || '',
      status: initialData?.status || CityStatus.ATIVA,
      totalVoters: initialData?.totalVoters || null,
      population: initialData?.population || null,
      ibgeCode: initialData?.ibgeCode || null,
      observations: initialData?.observations || null
    }

    const formMethods = useModalForm<CityRegistrationFormType>({
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
      formState: { errors, isValid }
    } = formMethods

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

    const handleStateChange = async (state: string) => {
      setValue('state', state)
      setValue('name', '')
      await trigger('state')
    }

    const handleCityChange = async (cityName: string) => {
      setValue('name', cityName)
      const city = cities.find((c) => c.nome === cityName)
      if (city) setValue('ibgeCode', city.id)
      await trigger('name')
    }

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['state', 'name', 'status'],
        requiredFields: ['state', 'name', 'status']
      },
      {
        title: 'Detalhes',
        fields: ['totalVoters', 'population', 'observations'],
        requiredFields: []
      },
      {
        title: 'Revisão',
        fields: [],
        requiredFields: []
      }
    ]

    const areRequiredFieldsValid = () =>
      steps[currentStep].requiredFields.every((field) => {
        const value = formData[field as keyof CityRegistrationFormType]
        const hasError = !!errors[field as keyof CityRegistrationFormType]
        return value && !hasError
      })

    const validateStep = async () => {
      const fieldsToValidate = steps[currentStep]
        .fields as (keyof CityRegistrationFormType)[]
      return await trigger(fieldsToValidate, { shouldFocus: true })
    }

    const nextStep = async () => {
      if (await validateStep()) {
        setCurrentStep((prev) => prev + 1)
      }
    }

    const prevStep = () => setCurrentStep((prev) => prev - 1)

    const handleSubmitClick = async () => {
      if (await validateStep()) {
        formMethods.handleSubmit(onSubmit!)()
      }
    }

    const descriptionFields: DynamicDescriptionsField<CityRegistrationFormType>[] =
      [
        { key: 'name', label: 'Nome da Cidade' },
        { key: 'state', label: 'Estado' },
        {
          key: 'status',
          label: 'Status',
          render: (value: CityStatus) => getCityStatusData(value).label
        },
        {
          key: 'totalVoters',
          label: 'Total de Eleitores',
          render: (v) => v ?? '-'
        },
        { key: 'population', label: 'População', render: (v) => v ?? '-' },
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
          <DetailsStep
            control={control}
            errors={errors}
            setValue={setValue}
            visible={currentStep === 1}
          />
          <ReviewStep
            control={control}
            errors={errors}
            formData={formData}
            setValue={setValue}
            visible={currentStep === 2}
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
      </StyledForm>
    )
  }
)

CityRegistrationForm.displayName = 'CityRegistrationForm'

// Steps Components
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
  descriptionFields?: DynamicDescriptionsField<CityRegistrationFormType>[]
  selectedState?: boolean
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
      <FormInputsWrapper>
        <Controller
          name="totalVoters"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Total de Eleitores (opcional)"
              help={errors.totalVoters?.message}
              validateStatus={errors.totalVoters ? 'error' : ''}
            >
              <StyledInput
                {...field}
                type="number"
                placeholder="Digite o número de eleitores"
                value={field.value || ''}
                onChange={(e) =>
                  setValue('totalVoters', parseInt(e.target.value) || null)
                }
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="population"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="População (opcional)"
              help={errors.population?.message}
              validateStatus={errors.population ? 'error' : ''}
            >
              <StyledInput
                {...field}
                type="number"
                placeholder="Digite a população"
                value={field.value || ''}
                onChange={(e) =>
                  setValue('population', parseInt(e.target.value) || null)
                }
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
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
