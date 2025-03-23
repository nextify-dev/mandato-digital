// src/components/forms/SegmentRegistrationForm/index.tsx

import React, { forwardRef, Ref, useEffect, useCallback } from 'react'
import * as S from './styles'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import {
  Select,
  Button,
  Input,
  Slider,
  Switch,
  DatePicker,
  message
} from 'antd'
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
import dayjs from 'dayjs'
import moment from 'moment'
import { GENDER_OPTIONS, RELIGION_OPTIONS } from '@/data/options'

const { TextArea } = Input
const { RangePicker } = DatePicker

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
      description: '',
      idadeMin: 18,
      idadeMax: 100,
      demandStatus: [],
      genero: [],
      religiao: [],
      escolaridade: [],
      rendaFamiliar: [],
      ocupacao: [],
      zonaEleitoral: [],
      dataCadastroInicio: undefined,
      dataCadastroFim: undefined,
      cityIds: [],
      isActive: true
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

    const ESCOLARIDADE_OPTIONS = [
      { label: 'Fundamental Incompleto', value: 'FUNDAMENTAL_INCOMPLETO' },
      { label: 'Fundamental Completo', value: 'FUNDAMENTAL_COMPLETO' },
      { label: 'Médio Incompleto', value: 'MEDIO_INCOMPLETO' },
      { label: 'Médio Completo', value: 'MEDIO_COMPLETO' },
      { label: 'Superior Incompleto', value: 'SUPERIOR_INCOMPLETO' },
      { label: 'Superior Completo', value: 'SUPERIOR_COMPLETO' },
      { label: 'Pós-graduação', value: 'POS_GRADUACAO' }
    ]

    const RENDA_FAMILIAR_OPTIONS = [
      { label: 'Até 1 salário mínimo', value: 'ATE_1_SALARIO' },
      { label: '1 a 2 salários mínimos', value: '1_A_2_SALARIOS' },
      { label: '2 a 5 salários mínimos', value: '2_A_5_SALARIOS' },
      { label: '5 a 10 salários mínimos', value: '5_A_10_SALARIOS' },
      { label: 'Acima de 10 salários mínimos', value: 'ACIMA_10_SALARIOS' }
    ]

    const OCUPACAO_OPTIONS = [
      { label: 'Estudante', value: 'ESTUDANTE' },
      { label: 'Autônomo', value: 'AUTONOMO' },
      { label: 'Assalariado', value: 'ASSALARIADO' },
      { label: 'Aposentado', value: 'APOSENTADO' },
      { label: 'Desempregado', value: 'DESEMPREGADO' },
      { label: 'Empresário', value: 'EMPRESARIO' },
      { label: 'Servidor Público', value: 'SERVIDOR_PUBLICO' }
    ]

    const ZONA_ELEITORAL_OPTIONS = [
      { label: 'Zona 1', value: 'ZONA_1' },
      { label: 'Zona 2', value: 'ZONA_2' },
      { label: 'Zona 3', value: 'ZONA_3' },
      { label: 'Zona 4', value: 'ZONA_4' },
      { label: 'Zona 5', value: 'ZONA_5' }
    ]

    const steps = [
      {
        title: 'Dados Básicos',
        fields: ['name', 'description', 'isActive'],
        requiredFields: ['name']
      },
      {
        title: 'Filtros Demográficos',
        fields:
          user?.role === UserRole.ADMINISTRADOR_GERAL
            ? [
                'cityIds',
                'idadeMin',
                'idadeMax',
                'genero',
                'religiao'
                // 'escolaridade',
                // 'rendaFamiliar',
                // 'ocupacao'
              ]
            : ['idadeMin', 'idadeMax', 'genero', 'religiao'],
        requiredFields: ['cityIds']
      },
      {
        title: 'Filtros Eleitorais',
        fields: [
          'demandStatus',
          'zonaEleitoral',
          'dataCadastroInicio',
          'dataCadastroFim'
        ],
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
          key: 'isActive',
          label: 'Ativo',
          render: (value) => (value ? 'Sim' : 'Não')
        },
        {
          key: 'description',
          label: 'Descrição',
          render: (value) => value || '-'
        },
        {
          key: 'cityIds',
          label: 'Cidades',
          render: (value) =>
            `cities.find((city) => city.id === value)?.name || value || '-'`
        },
        {
          key: 'idadeMin',
          label: 'Faixa Etária',
          render: (record) => {
            const idadeMin = record.idadeMin
            const idadeMax = record.idadeMax
            if (idadeMin && idadeMax) {
              return `${idadeMin} - ${idadeMax} anos`
            }
            return '-'
          }
        },
        {
          key: 'genero',
          label: 'Gênero',
          render: (value: string[]) =>
            value && value.length > 0 ? value.join(', ') : '-'
        },
        {
          key: 'religiao',
          label: 'Religião',
          render: (value: string[]) =>
            value && value.length > 0 ? value.join(', ') : '-'
        },
        // {
        //   key: 'escolaridade',
        //   label: 'Escolaridade',
        //   render: (value: string[]) =>
        //     value && value.length > 0
        //       ? value
        //           .map(
        //             (v) =>
        //               ESCOLARIDADE_OPTIONS.find((opt) => opt.value === v)?.label
        //           )
        //           .join(', ')
        //       : '-'
        // },
        // {
        //   key: 'rendaFamiliar',
        //   label: 'Renda Familiar',
        //   render: (value: string[]) =>
        //     value && value.length > 0
        //       ? value
        //           .map(
        //             (v) =>
        //               RENDA_FAMILIAR_OPTIONS.find((opt) => opt.value === v)
        //                 ?.label
        //           )
        //           .join(', ')
        //       : '-'
        // },
        // {
        //   key: 'ocupacao',
        //   label: 'Ocupação',
        //   render: (value: string[]) =>
        //     value && value.length > 0
        //       ? value
        //           .map(
        //             (v) =>
        //               OCUPACAO_OPTIONS.find((opt) => opt.value === v)?.label
        //           )
        //           .join(', ')
        //       : '-'
        // },
        {
          key: 'demandStatus',
          label: 'Status das Demandas',
          render: (value: DemandStatus[]) =>
            value && value.length > 0
              ? value
                  .map((status) => getDemandStatusData(status).label)
                  .join(', ')
              : '-'
        },
        {
          key: 'zonaEleitoral',
          label: 'Zona Eleitoral',
          render: (value: string[]) =>
            value && value.length > 0
              ? value
                  .map(
                    (v) =>
                      ZONA_ELEITORAL_OPTIONS.find((opt) => opt.value === v)
                        ?.label
                  )
                  .join(', ')
              : '-'
        },
        {
          key: 'dataCadastroInicio',
          label: 'Período de Cadastro',
          render: (record) => {
            const inicio = record?.dataCadastroInicio
            const fim = record?.dataCadastroFim
            if (inicio && fim) {
              return `${moment(inicio).format('DD/MM/YYYY')} - ${moment(
                fim
              ).format('DD/MM/YYYY')}`
            }
            return '-'
          }
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
            />
            <DemographicFiltersStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 1}
              genderOptions={GENDER_OPTIONS}
              religionOptions={RELIGION_OPTIONS}
              escolaridadeOptions={ESCOLARIDADE_OPTIONS}
              rendaFamiliarOptions={RENDA_FAMILIAR_OPTIONS}
              ocupacaoOptions={OCUPACAO_OPTIONS}
              mode={mode}
              cityOptions={CITY_OPTIONS}
              isAdminGeral={user?.role === UserRole.ADMINISTRADOR_GERAL}
            />
            <ElectoralFiltersStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 2}
              demandStatusOptions={DEMAND_STATUS_OPTIONS}
              zonaEleitoralOptions={ZONA_ELEITORAL_OPTIONS}
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
  genderOptions?: { label: string; value: string }[]
  religionOptions?: { label: string; value: string }[]
  escolaridadeOptions?: { label: string; value: string }[]
  rendaFamiliarOptions?: { label: string; value: string }[]
  ocupacaoOptions?: { label: string; value: string }[]
  demandStatusOptions?: { label: string; value: string }[]
  zonaEleitoralOptions?: { label: string; value: string }[]
  descriptionFields?: DynamicDescriptionsField<SegmentRegistrationFormType>[]
  initialData?: Partial<SegmentRegistrationFormType>
  isAdminGeral?: boolean
}

const BasicDataStep = ({
  control,
  errors,
  setValue,
  visible
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
              placeholder="Descreva o objetivo deste segmento"
              value={field.value}
              onChange={(e) => setValue('description', e.target.value)}
              rows={4}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <StyledForm.Item label="Inicialmente ativo?">
            <Switch
              checked={field.value}
              onChange={(checked) => setValue('isActive', checked)}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const DemographicFiltersStep = ({
  control,
  errors,
  setValue,
  visible,
  genderOptions,
  religionOptions,
  escolaridadeOptions,
  rendaFamiliarOptions,
  ocupacaoOptions,
  mode,
  cityOptions,
  isAdminGeral
}: ISegmentRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      {isAdminGeral && (
        <Controller
          name="cityIds"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Cidade"
              help={errors.cityIds?.message}
              validateStatus={errors.cityIds ? 'error' : ''}
            >
              <Select
                {...field}
                mode="multiple"
                placeholder="Selecione a cidade"
                options={cityOptions}
                onChange={(value) => setValue('cityIds', value)}
                value={field.value}
                disabled={mode === 'edit'}
              />
            </StyledForm.Item>
          )}
        />
      )}
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
              style={{ marginInline: 10 }}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="genero"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Gênero (opcional)"
            help={errors.genero?.message}
            validateStatus={errors.genero ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione os gêneros"
              options={genderOptions}
              onChange={(value) => setValue('genero', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="religiao"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Religão (opcional)"
            help={errors.religiao?.message}
            validateStatus={errors.religiao ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione as religiões"
              options={religionOptions}
              onChange={(value) => setValue('religiao', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
      {/* <Controller
        name="escolaridade"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Escolaridade (opcional)"
            help={errors.escolaridade?.message}
            validateStatus={errors.escolaridade ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione os níveis de escolaridade"
              options={escolaridadeOptions}
              onChange={(value) => setValue('escolaridade', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="rendaFamiliar"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Renda Familiar (opcional)"
            help={errors.rendaFamiliar?.message}
            validateStatus={errors.rendaFamiliar ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione as faixas de renda"
              options={rendaFamiliarOptions}
              onChange={(value) => setValue('rendaFamiliar', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="ocupacao"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Ocupação (opcional)"
            help={errors.ocupacao?.message}
            validateStatus={errors.ocupacao ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione as ocupações"
              options={ocupacaoOptions}
              onChange={(value) => setValue('ocupacao', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      /> */}
    </FormStep>
  )
}

const ElectoralFiltersStep = ({
  control,
  errors,
  setValue,
  visible,
  demandStatusOptions,
  zonaEleitoralOptions
}: ISegmentRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
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
      <Controller
        name="zonaEleitoral"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Zona Eleitoral (opcional)"
            help={errors.zonaEleitoral?.message}
            validateStatus={errors.zonaEleitoral ? 'error' : ''}
          >
            <Select
              {...field}
              mode="multiple"
              placeholder="Selecione as zonas eleitorais"
              options={zonaEleitoralOptions}
              onChange={(value) => setValue('zonaEleitoral', value)}
              value={field.value}
              disabled
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="dataCadastroInicio"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Período de Cadastro (opcional)"
            help={
              errors.dataCadastroInicio?.message ||
              errors.dataCadastroFim?.message
            }
            validateStatus={
              errors.dataCadastroInicio || errors.dataCadastroFim ? 'error' : ''
            }
          >
            <RangePicker
              format="DD/MM/YYYY"
              onChange={(dates) => {
                if (dates) {
                  setValue('dataCadastroInicio', dates[0]?.toISOString())
                  setValue('dataCadastroFim', dates[1]?.toISOString())
                } else {
                  setValue('dataCadastroInicio', undefined)
                  setValue('dataCadastroFim', undefined)
                }
              }}
              value={[
                field.value ? dayjs(field.value) : null,
                control._formValues.dataCadastroFim
                  ? dayjs(control._formValues.dataCadastroFim)
                  : null
              ]}
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
