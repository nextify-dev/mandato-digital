// src/components/forms/SegmentRegistrationForm/index.tsx

import React, { forwardRef, Ref, useEffect, useCallback, useState } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, Button, Input, Slider, message } from 'antd'
import { StyledForm, StyledButton, StyledSteps } from '@/utils/styles/antd'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  SegmentRegistrationFormType,
  getSegmentRegistrationSchema
} from '@/@types/segment'
import { DemandStatus, getDemandStatusData } from '@/@types/demand'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'
import { useCities } from '@/contexts/CitiesProvider'
import { useAuth } from '@/contexts/AuthProvider'
import { UserRole } from '@/@types/user'

const { TextArea } = Input

type FormMode = 'create' | 'edit' | 'viewOnly'

interface SegmentRegistrationFormProps {
  onSubmit?: (data: SegmentRegistrationFormType) => Promise<void>
  initialData?: Partial<SegmentRegistrationFormType>
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  loading?: boolean
}

const SegmentRegistrationForm = forwardRef<
  UseFormReturn<SegmentRegistrationFormType>,
  SegmentRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode, currentStep, setCurrentStep, loading },
    ref: Ref<UseFormReturn<SegmentRegistrationFormType>>
  ) => {
    const [messageApi, contextHolder] = message.useMessage()
    const { user } = useAuth()
    const { cities } = useCities()

    const defaultValues: DefaultValues<SegmentRegistrationFormType> = {
      name: '',
      bairro: undefined,
      idadeMin: 18,
      idadeMax: 100,
      demandStatus: [],
      cityId:
        user?.role === UserRole.ADMINISTRADOR_GERAL ? '' : user?.cityId || ''
    }

    const formMethods = useModalForm<SegmentRegistrationFormType>({
      schema: getSegmentRegistrationSchema(),
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
        setCurrentStep(0)
      } else if (initialData && (mode === 'edit' || mode === 'viewOnly')) {
        reset({ ...defaultValues, ...initialData })
        setCurrentStep(0)
      }
    }, [initialData, mode, reset, setCurrentStep])

    const formData = watch()

    const CITY_OPTIONS = cities.map((city) => ({
      label: city.name,
      value: city.id
    }))

    const DEMAND_STATUS_OPTIONS = Object.values(DemandStatus).map((status) => ({
      label: getDemandStatusData(status).label,
      value: status
    }))

    const steps = [
      {
        title: 'Dados Básicos',
        fields:
          user?.role === UserRole.ADMINISTRADOR_GERAL
            ? ['name', 'cityId']
            : ['name'],
        requiredFields: ['name']
      },
      {
        title: 'Filtros',
        fields: ['bairro', 'idadeMin', 'idadeMax', 'demandStatus'],
        requiredFields: []
      },
      { title: 'Revisão', fields: [], requiredFields: [] }
    ]

    const areRequiredFieldsValid = useCallback(
      (stepIndex: number) => {
        const requiredFields = steps[stepIndex].requiredFields
        return requiredFields.every((field) => {
          const value = formData[field as keyof SegmentRegistrationFormType]
          const hasError = !!errors[field as keyof SegmentRegistrationFormType]
          return value !== undefined && value !== '' && !hasError
        })
      },
      [formData, errors]
    )

    const validateStep = useCallback(
      async (stepIndex: number) => {
        const fieldsToValidate = steps[stepIndex]
          .fields as (keyof SegmentRegistrationFormType)[]
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
        await onSubmit?.(formData)
      }
    }

    const descriptionFields: DynamicDescriptionsField<SegmentRegistrationFormType>[] =
      [
        { key: 'name', label: 'Nome do Segmento' },
        {
          key: 'cityId',
          label: 'Cidade',
          render: (value) =>
            cities.find((city) => city.id === value)?.name || value || '-'
        },
        { key: 'bairro', label: 'Bairro' },
        { key: 'idadeMin', label: 'Idade Mínima' },
        { key: 'idadeMax', label: 'Idade Máxima' },
        {
          key: 'demandStatus',
          label: 'Status das Demandas',
          render: (value: DemandStatus[]) =>
            value && value.length > 0
              ? value
                  .map((status) => getDemandStatusData(status).label)
                  .join(', ')
              : '-'
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
          <S.SegmentRegistrationFormContent>
            <BasicDataStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
              mode={mode}
              cityOptions={CITY_OPTIONS}
              isAdminGeral={user?.role === UserRole.ADMINISTRADOR_GERAL}
            />
            <FiltersStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 1}
              demandStatusOptions={DEMAND_STATUS_OPTIONS}
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
          </S.SegmentRegistrationFormContent>
          <S.SegmentRegistrationFormFooter>
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
                {mode === 'edit' ? 'Atualizar Segmento' : 'Criar Segmento'}
              </StyledButton>
            )}
          </S.SegmentRegistrationFormFooter>
        </StyledForm>
        {contextHolder}
      </>
    )
  }
)

SegmentRegistrationForm.displayName = 'SegmentRegistrationForm'

export default SegmentRegistrationForm

interface ISegmentRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  visible: boolean
  mode?: FormMode
  cityOptions?: { label: string; value: string }[]
  demandStatusOptions?: { label: string; value: string }[]
  descriptionFields?: DynamicDescriptionsField<SegmentRegistrationFormType>[]
  initialData?: Partial<SegmentRegistrationFormType>
  isAdminGeral?: boolean
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible,
  mode,
  cityOptions,
  isAdminGeral
}: ISegmentRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Nome do Segmento"
            help={errors.name?.message}
            validateStatus={errors.name ? 'error' : ''}
          >
            <Input
              {...field}
              placeholder="Digite o nome do segmento"
              value={field.value}
              onChange={(e) => setValue('name', e.target.value)}
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
              />
            </StyledForm.Item>
          )}
        />
      )}
    </FormStep>
  )
}

const FiltersStep = ({
  control,
  errors,
  setValue,
  visible,
  demandStatusOptions
}: ISegmentRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="bairro"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Bairro (opcional)"
            help={errors.bairro?.message}
            validateStatus={errors.bairro ? 'error' : ''}
          >
            <Input
              {...field}
              placeholder="Digite o bairro"
              value={field.value}
              onChange={(e) => setValue('bairro', e.target.value)}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="idadeMin"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Faixa Etária (opcional)"
            help={errors.idadeMin?.message || errors.idadeMax?.message}
            validateStatus={errors.idadeMin || errors.idadeMax ? 'error' : ''}
          >
            <Slider
              range
              min={18}
              max={100}
              defaultValue={[
                field.value || 18,
                control._formValues.idadeMax || 100
              ]}
              onChange={(value: number[]) => {
                setValue('idadeMin', value[0])
                setValue('idadeMax', value[1])
              }}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="demandStatus"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Status das Demandas (opcional)"
            help={errors.demandStatus?.message}
            validateStatus={errors.demandStatus ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione os status das demandas"
              options={demandStatusOptions}
              onChange={(value) => setValue('demandStatus', value)}
              value={field.value}
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
  descriptionFields,
  initialData
}: ISegmentRegistrationStep) => (
  <FormStep visible={visible ? 1 : 0}>
    <DynamicDescriptions data={formData} fields={descriptionFields || []} />
  </FormStep>
)
