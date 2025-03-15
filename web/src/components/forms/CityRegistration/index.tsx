// src/screens/DashboardV1/views/GestaoCidades/components/CityRegistrationForm.tsx
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
import { applyMask } from '@/utils/functions/masks'
import {
  CityStatus,
  getCityRegistrationSchema,
  CityRegistrationFormType,
  getCityStatusData
} from '@/@types/city'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import { DynamicDescriptions } from '@/components'
import { citiesService } from '@/services/cities'
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
    const [registeredCities, setRegisteredCities] = useState<string[]>([])
    const [isCitiesLoading, setIsCitiesLoading] = useState(false)

    const defaultValues: DefaultValues<CityRegistrationFormType> = {
      name: initialData?.name || undefined,
      status: initialData?.status || CityStatus.PENDENTE,
      description: initialData?.description || null,
      totalUsers: initialData?.totalUsers || 0,
      population: initialData?.population || null,
      area: initialData?.area || null,
      cepRangeStart: initialData?.cepRangeStart || null,
      cepRangeEnd: initialData?.cepRangeEnd || null,
      state: initialData?.state || undefined
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

      const fetchRegisteredCities = async () => {
        const citiesData = await citiesService.getCities({})
        setRegisteredCities(citiesData.map((city) => city.name))
      }
      fetchRegisteredCities()
    }, [])

    useEffect(() => {
      const fetchCities = async () => {
        if (selectedState && mode === 'create') {
          setIsCitiesLoading(true)
          const cityData = await ibgeService.getCitiesByState(selectedState)

          const availableCities = cityData.filter(
            (city) => !registeredCities.includes(city.nome)
          )
          setCities(availableCities)
          setIsCitiesLoading(false)
        }
      }
      fetchCities()
    }, [selectedState, registeredCities, mode])

    const handleStateChange = async (state: string) => {
      setValue('state', state)
      setValue('name', '') // Resetar cidade ao mudar estado
      await trigger('state')
    }

    const handleCityChange = async (cityName: string) => {
      setValue('name', cityName)
      const details = await ibgeService.getCityDetails(cityName, selectedState)
      setValue('population', details.population)
      setValue('area', details.area)
      setValue('cepRangeStart', details.cepRangeStart)
      setValue('cepRangeEnd', details.cepRangeEnd)
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
        fields: ['description', 'population', 'area'],
        requiredFields: []
      },
      {
        title: 'Faixa de CEP',
        fields: ['cepRangeStart', 'cepRangeEnd'],
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
        {
          key: 'status',
          label: 'Status',
          render: (value: CityStatus) => getCityStatusData(value).label
        },
        { key: 'state', label: 'Estado' },
        { key: 'description', label: 'Descrição' },
        {
          key: 'totalUsers',
          label: 'Total de Usuários',
          render: (value: number) => value ?? 0
        },
        {
          key: 'population',
          label: 'População',
          render: (value: number | null) => value ?? '-'
        },
        {
          key: 'area',
          label: 'Área (km²)',
          render: (value: number | null) => value ?? '-'
        },
        {
          key: 'cepRangeStart',
          label: 'CEP Inicial',
          render: (value: string | null) =>
            value ? applyMask(value, 'cep') : '-'
        },
        {
          key: 'cepRangeEnd',
          label: 'CEP Final',
          render: (value: string | null) =>
            value ? applyMask(value, 'cep') : '-'
        }
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
            selectedState={!!selectedState && selectedState !== ''}
          />
          <DetailsStep
            control={control}
            errors={errors}
            setValue={setValue}
            visible={currentStep === 1}
          />
          <CepRangeStep
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
      </StyledForm>
    )
  }
)

CityRegistrationForm.displayName = 'CityRegistrationForm'

// ==================================================== STEPS COMPONENTS

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
              style={{ width: '16%' }}
            >
              <Select
                {...field}
                // placeholder="Selecione o estado"
                options={states?.map((state) => ({
                  label: state.sigla,
                  value: state.sigla
                }))}
                onChange={(value) => onStateChange!(value)}
                value={field.value}
                disabled={mode === 'edit'} // Bloqueia edição do estado
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
              style={{ width: '42%' }}
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
                disabled={mode === 'edit' || !selectedState} // Bloqueia edição e exige estado
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
              style={{ width: '42%' }}
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
              rows={4}
              placeholder="Digite uma descrição da cidade"
              value={field.value || ''}
            />
          </StyledForm.Item>
        )}
      />
      <FormInputsWrapper>
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
        <Controller
          name="area"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Área em km² (opcional)"
              help={errors.area?.message}
              validateStatus={errors.area ? 'error' : ''}
            >
              <StyledInput
                {...field}
                type="number"
                placeholder="Digite a área"
                value={field.value || ''}
                onChange={(e) =>
                  setValue('area', parseFloat(e.target.value) || null)
                }
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
    </FormStep>
  )
}

const CepRangeStep = ({
  control,
  errors,
  setValue,
  visible
}: ICityRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <FormInputsWrapper>
        <Controller
          name="cepRangeStart"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="CEP Inicial (opcional)"
              help={errors.cepRangeStart?.message}
              validateStatus={errors.cepRangeStart ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="00000-000"
                value={field.value || ''}
                onChange={(e) =>
                  setValue('cepRangeStart', applyMask(e.target.value, 'cep'))
                }
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="cepRangeEnd"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="CEP Final (opcional)"
              help={errors.cepRangeEnd?.message}
              validateStatus={errors.cepRangeEnd ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="00000-000"
                value={field.value || ''}
                onChange={(e) =>
                  setValue('cepRangeEnd', applyMask(e.target.value, 'cep'))
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
