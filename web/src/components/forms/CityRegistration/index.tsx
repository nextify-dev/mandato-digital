// src/screens/DashboardV1/views/GestaoCidades/components/CityRegistrationForm.tsx
import React, { forwardRef, Ref } from 'react'

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
    const defaultValues: DefaultValues<CityRegistrationFormType> = {
      name: initialData?.name || '',
      status: initialData?.status || CityStatus.PENDENTE,
      description: initialData?.description || null,
      totalUsers: initialData?.totalUsers || 0,
      population: initialData?.population || null,
      area: initialData?.area || null,
      cepRangeStart:
        (initialData?.cepRangeStart &&
          applyMask(initialData?.cepRangeStart, 'cep')) ||
        null,
      cepRangeEnd:
        (initialData?.cepRangeEnd &&
          applyMask(initialData?.cepRangeEnd, 'cep')) ||
        null,
      state: initialData?.state || ''
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
      setError,
      clearErrors,
      formState: { errors, isValid }
    } = formMethods

    const formData = watch()

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['name', 'status', 'state'],
        requiredFields: ['name', 'status', 'state']
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

    const areRequiredFieldsValid = () => {
      const requiredFields = steps[currentStep]
        .requiredFields as (keyof CityRegistrationFormType)[]
      return requiredFields.every((field) => {
        const value = formData[field]
        const hasError = !!errors[field]
        return (
          value !== '' && value !== null && value !== undefined && !hasError
        )
      })
    }

    const validateStep = async () => {
      const fieldsToValidate = steps[currentStep]
        .fields as (keyof CityRegistrationFormType)[]
      const isValidStep = await trigger(fieldsToValidate, { shouldFocus: true })
      return isValidStep
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

    // Função de validação no onBlur
    const validateNameUniqueness = async (name: string) => {
      const isUnique = await citiesService.checkCityNameUniqueness(
        name,
        initialData?.name
      )
      if (!isUnique) {
        setError('name', {
          type: 'manual',
          message: 'Esta cidade já está registrada'
        })
      } else {
        clearErrors('name')
        await trigger('name') // Revalida o campo com o schema
      }
    }

    // Campos para Descriptions
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

    // Renderização para modo viewOnly
    const renderViewOnlyMode = () => {
      return (
        <DynamicDescriptions
          data={initialData ?? {}}
          fields={descriptionFields}
          title="Detalhes da Cidade"
        />
      )
    }

    if (mode === 'viewOnly') {
      return renderViewOnlyMode()
    }

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
            validateNameUniqueness={validateNameUniqueness}
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
              {!!initialData ? 'Atualizar Cidade' : 'Criar Cidade'}
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
  descriptionFields?: DynamicDescriptionsField<CityRegistrationFormType>[]
  validateNameUniqueness?: (name: string) => Promise<void>
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible,
  validateNameUniqueness
}: ICityRegistrationStep) => {
  const CITY_STATUS_OPTIONS = Object.values(CityStatus).map((status) => ({
    label: getCityStatusData(status).label,
    value: status
  }))

  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Nome da Cidade"
            help={errors.name?.message}
            validateStatus={errors.name ? 'error' : ''}
          >
            <StyledInput
              {...field}
              placeholder="Digite o nome da cidade"
              onBlur={(e) => validateNameUniqueness!(e.target.value)}
            />
          </StyledForm.Item>
        )}
      />
      <FormInputsWrapper>
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
                options={CITY_STATUS_OPTIONS}
                onChange={(value) => setValue('status', value)}
                value={field.value}
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Estado"
              help={errors.state?.message}
              validateStatus={errors.state ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="Digite o estado (ex.: SP)"
                maxLength={2}
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
}: ICityRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <DynamicDescriptions data={formData} fields={descriptionFields || []} />
    </FormStep>
  )
}

export default CityRegistrationForm
