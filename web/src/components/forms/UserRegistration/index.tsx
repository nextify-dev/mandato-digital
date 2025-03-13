// src/components/forms/UserRegistration/index.tsx

import React, { useState } from 'react'
import * as S from './styles'
import { Steps, Descriptions, Select, Input } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  StyledForm,
  StyledInput,
  StyledButton,
  StyledSteps,
  StyledDescriptions
} from '@/utils/styles/antd'
import { applyMask } from '@/utils/functions/masks'
import {
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  getGenderLabel,
  getReligionLabel
} from '@/data/options'
import {
  UserRole,
  getUserRegistrationSchema,
  UserRegistrationFormType,
  getRoleData
} from '@/@types/user'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { fetchAddressByCep } from '@/utils/functions/geolocation'

const { TextArea } = Input

type FormMode = 'firstAccess' | 'voterCreation' | 'userCreation'

interface UserRegistrationFormProps {
  onSubmit: (data: UserRegistrationFormType) => Promise<void>
  initialData?: Partial<UserRegistrationFormType>
  mode: FormMode
}

const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({
  onSubmit,
  initialData,
  mode
}) => {
  const [currentStep, setCurrentStep] = useState(0)

  const {
    control,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors, isValid }
  } = useForm<UserRegistrationFormType>({
    resolver: yupResolver(getUserRegistrationSchema(mode)),
    mode: 'onBlur',
    defaultValues: {
      email: initialData?.email || '',
      nomeCompleto: initialData?.nomeCompleto || '',
      cpf: initialData?.cpf || '',
      dataNascimento: initialData?.dataNascimento || '',
      genero: initialData?.genero || undefined,
      religiao: initialData?.religiao || undefined,
      foto: initialData?.foto || null,
      telefone: initialData?.telefone || null,
      whatsapp: initialData?.whatsapp || '',
      instagram: initialData?.instagram || null,
      facebook: initialData?.facebook || null,
      cep: initialData?.cep || '',
      endereco: initialData?.endereco || '',
      numero: initialData?.numero || '',
      complemento: initialData?.complemento || null,
      bairro: initialData?.bairro || '',
      cidade: initialData?.cidade || '',
      estado: initialData?.estado || '',
      password: mode === 'firstAccess' ? '' : undefined,
      confirmPassword: mode === 'firstAccess' ? '' : undefined,
      observacoes: initialData?.observacoes || undefined,
      role: mode === 'userCreation' ? undefined : undefined,
      creationMode: mode === 'userCreation' ? 'fromScratch' : undefined
    }
  })

  const formData = watch()

  const USER_ROLE_OPTIONS = Object.values(UserRole)
    .filter((role) => role !== UserRole.ELEITOR)
    .map((role) => ({
      label: getRoleData(role).label,
      value: role
    }))

  const steps = [
    ...(mode === 'userCreation'
      ? [
          {
            title: 'Modo de Criação',
            fields: ['creationMode', 'role'],
            requiredFields: ['creationMode', 'role']
          }
        ]
      : []),
    {
      title: 'Dados Pessoais',
      fields: [
        'email',
        'nomeCompleto',
        'cpf',
        'dataNascimento',
        'genero',
        'religiao'
      ],
      requiredFields: [
        'email',
        'nomeCompleto',
        'cpf',
        'dataNascimento',
        'genero',
        'religiao'
      ]
    },
    {
      title: 'Contato',
      fields: ['telefone', 'whatsapp', 'instagram', 'facebook'],
      requiredFields: ['whatsapp']
    },
    {
      title: 'Endereço',
      fields: [
        'cep',
        'endereco',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'estado'
      ],
      requiredFields: [
        'cep',
        'endereco',
        'numero',
        'bairro',
        'cidade',
        'estado'
      ]
    },
    {
      title:
        mode === 'firstAccess' ? 'Revisão e Senha' : 'Revisão e Observações',
      fields:
        mode === 'firstAccess'
          ? ['password', 'confirmPassword']
          : [
              // 'observacoes'
            ],
      requiredFields:
        mode === 'firstAccess'
          ? ['password', 'confirmPassword']
          : [
              // 'observacoes'
            ]
    }
  ]

  const areRequiredFieldsValid = () => {
    const requiredFields = steps[currentStep]
      .requiredFields as (keyof UserRegistrationFormType)[]
    return requiredFields.every((field) => {
      const value = formData[field]
      const hasError = !!errors[field]
      return value !== '' && value !== null && value !== undefined && !hasError
    })
  }

  const validateStep = async () => {
    const fieldsToValidate = steps[currentStep]
      .fields as (keyof UserRegistrationFormType)[]
    const isValidStep = await trigger(fieldsToValidate, { shouldFocus: true })
    return isValidStep
  }

  const nextStep = async () => {
    if (await validateStep()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => setCurrentStep((prev) => prev - 1)

  const onFinish = async (data: UserRegistrationFormType) => {
    await onSubmit(data)
  }

  return (
    <StyledForm onFinish={handleSubmit(onFinish)} layout="vertical">
      <StyledSteps
        current={currentStep}
        items={steps.map((step) => ({ title: step.title }))}
        labelPlacement="vertical"
      />
      <div style={{ marginTop: 24 }}>
        {mode === 'userCreation' && (
          <CreationModeStep
            control={control}
            errors={errors}
            setValue={setValue}
            visible={currentStep === 0}
            roleOptions={USER_ROLE_OPTIONS}
          />
        )}
        <DadosPessoaisStep
          control={control}
          errors={errors}
          setValue={setValue}
          mode={mode}
          visible={currentStep === (mode === 'userCreation' ? 1 : 0)}
        />
        <ContatoStep
          control={control}
          errors={errors}
          setValue={setValue}
          visible={currentStep === (mode === 'userCreation' ? 2 : 1)}
        />
        <EnderecoStep
          control={control}
          errors={errors}
          setValue={setValue}
          trigger={trigger}
          visible={currentStep === (mode === 'userCreation' ? 3 : 2)}
        />
        <ReviewStep
          control={control}
          errors={errors}
          setValue={setValue}
          formData={formData}
          mode={mode}
          visible={currentStep === (mode === 'userCreation' ? 4 : 3)}
        />
      </div>
      <StyledForm.Item style={{ marginTop: 24 }}>
        {currentStep > 0 && (
          <StyledButton style={{ marginRight: 8 }} onClick={prevStep}>
            Voltar
          </StyledButton>
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
          <StyledButton type="primary" htmlType="submit" disabled={!isValid}>
            Completar Cadastro
          </StyledButton>
        )}
      </StyledForm.Item>
    </StyledForm>
  )
}

export default UserRegistrationForm

// ==================================================== STEPS COMPONENTS

interface IUserRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  trigger?: any
  visible: boolean
  mode?: FormMode
  roleOptions?: { label: string; value: UserRole }[]
}

const CreationModeStep = ({
  control,
  errors,
  setValue,
  visible,
  roleOptions
}: IUserRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="creationMode"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Modo de Criação"
            help={errors.creationMode?.message}
            validateStatus={errors.creationMode ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione o modo de criação"
              options={[
                { label: 'Do Zero', value: 'fromScratch' },
                { label: 'A partir de Eleitor', value: 'fromVoter' }
              ]}
              onChange={(value) => setValue('creationMode', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Cargo"
            help={errors.role?.message}
            validateStatus={errors.role ? 'error' : ''}
          >
            <Select
              {...field}
              placeholder="Selecione o cargo"
              options={roleOptions}
              onChange={(value) => setValue('role', value)}
              value={field.value}
            />
          </StyledForm.Item>
        )}
      />
    </FormStep>
  )
}

const DadosPessoaisStep = ({
  control,
  errors,
  setValue,
  visible,
  mode
}: IUserRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Email"
            help={errors.email?.message}
            validateStatus={errors.email ? 'error' : ''}
          >
            <StyledInput
              {...field}
              placeholder="Digite seu email"
              disabled={mode === 'firstAccess'}
            />
          </StyledForm.Item>
        )}
      />
      <Controller
        name="nomeCompleto"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Nome Completo"
            help={errors.nomeCompleto?.message}
            validateStatus={errors.nomeCompleto ? 'error' : ''}
          >
            <StyledInput {...field} placeholder="Digite seu nome completo" />
          </StyledForm.Item>
        )}
      />
      <FormInputsWrapper>
        <Controller
          name="cpf"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="CPF"
              help={errors.cpf?.message}
              validateStatus={errors.cpf ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="000.000.000-00"
                onChange={(e) =>
                  setValue('cpf', applyMask(e.target.value, 'cpf'))
                }
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="dataNascimento"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Data de Nascimento"
              help={errors.dataNascimento?.message}
              validateStatus={errors.dataNascimento ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="DD/MM/AAAA"
                onChange={(e) =>
                  setValue(
                    'dataNascimento',
                    applyMask(e.target.value, 'birthDate')
                  )
                }
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
      <FormInputsWrapper>
        <Controller
          name="genero"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Gênero"
              help={errors.genero?.message}
              validateStatus={errors.genero ? 'error' : ''}
            >
              <Select
                {...field}
                placeholder="Selecione seu gênero"
                options={GENDER_OPTIONS}
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
              label="Religião"
              help={errors.religiao?.message}
              validateStatus={errors.religiao ? 'error' : ''}
            >
              <Select
                {...field}
                placeholder="Selecione sua religião"
                options={RELIGION_OPTIONS}
                onChange={(value) => setValue('religiao', value)}
                value={field.value}
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
    </FormStep>
  )
}

const ContatoStep = ({
  control,
  errors,
  setValue,
  visible
}: IUserRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <FormInputsWrapper>
        <Controller
          name="telefone"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Telefone (opcional)"
              help={errors.telefone?.message}
              validateStatus={errors.telefone ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="(00) 00000-0000"
                value={field.value || ''}
                onChange={(e) =>
                  setValue('telefone', applyMask(e.target.value, 'phone'))
                }
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="whatsapp"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="WhatsApp"
              help={errors.whatsapp?.message}
              validateStatus={errors.whatsapp ? 'error' : ''}
            >
              <StyledInput
                {...field}
                placeholder="(00) 00000-0000"
                onChange={(e) =>
                  setValue('whatsapp', applyMask(e.target.value, 'phone'))
                }
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
      <FormInputsWrapper>
        <Controller
          name="instagram"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Instagram (opcional)"
              help={errors.instagram?.message}
              validateStatus={errors.instagram ? 'error' : ''}
            >
              <StyledInput
                {...field}
                value={field.value || ''}
                placeholder="Digite seu Instagram"
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="facebook"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Facebook (opcional)"
              help={errors.facebook?.message}
              validateStatus={errors.facebook ? 'error' : ''}
            >
              <StyledInput
                {...field}
                value={field.value || ''}
                placeholder="Digite seu Facebook"
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
    </FormStep>
  )
}

const EnderecoStep = ({
  control,
  errors,
  setValue,
  visible,
  trigger
}: IUserRegistrationStep) => {
  const [cepSearchLoading, setCepSearchLoading] = useState(false)

  const handleCepBlur = async (cep: string) => {
    setCepSearchLoading(true)
    try {
      const addressData = await fetchAddressByCep(cep)
      setValue('endereco', addressData.logradouro || '')
      setValue('bairro', addressData.bairro || '')
      setValue('cidade', addressData.localidade || '')
      setValue('estado', addressData.uf || '')
      await trigger(['endereco', 'bairro', 'cidade', 'estado'])
    } catch (error: any) {
      console.error('Erro ao buscar CEP:', error.message)
      setValue('endereco', '')
      setValue('bairro', '')
      setValue('cidade', '')
      setValue('estado', '')
    } finally {
      setCepSearchLoading(false)
    }
  }

  return (
    <FormStep visible={visible ? 1 : 0}>
      <Controller
        name="cep"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="CEP"
            help={errors.cep?.message}
            validateStatus={errors.cep ? 'error' : ''}
            style={{ maxWidth: 120 }}
          >
            <StyledInput
              {...field}
              placeholder="00000-000"
              onChange={(e) =>
                setValue('cep', applyMask(e.target.value, 'cep'))
              }
              onBlur={(e) => handleCepBlur(e.target.value)}
              disabled={cepSearchLoading}
            />
          </StyledForm.Item>
        )}
      />
      <FormInputsWrapper>
        <Controller
          name="endereco"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Endereço"
              help={errors.endereco?.message}
              validateStatus={errors.endereco ? 'error' : ''}
              style={{ maxWidth: '100%' }}
            >
              <StyledInput
                {...field}
                autoComplete="off"
                disabled
                placeholder="Digite seu endereço"
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="numero"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Número"
              help={errors.numero?.message}
              validateStatus={errors.numero ? 'error' : ''}
              style={{ maxWidth: 140 }}
            >
              <StyledInput
                {...field}
                autoComplete="off"
                disabled={cepSearchLoading}
                placeholder="Digite o número"
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
      <FormInputsWrapper>
        <Controller
          name="bairro"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Bairro"
              help={errors.bairro?.message}
              validateStatus={errors.bairro ? 'error' : ''}
            >
              <StyledInput
                {...field}
                autoComplete="off"
                disabled
                placeholder="Digite o bairro"
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="cidade"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Cidade"
              help={errors.cidade?.message}
              validateStatus={errors.cidade ? 'error' : ''}
            >
              <StyledInput
                {...field}
                autoComplete="off"
                disabled
                placeholder="Digite a cidade"
              />
            </StyledForm.Item>
          )}
        />
        <Controller
          name="estado"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Estado"
              help={errors.estado?.message}
              validateStatus={errors.estado ? 'error' : ''}
            >
              <StyledInput
                {...field}
                autoComplete="off"
                disabled
                placeholder="Digite o estado"
              />
            </StyledForm.Item>
          )}
        />
      </FormInputsWrapper>
      <Controller
        name="complemento"
        control={control}
        render={({ field }) => (
          <StyledForm.Item
            label="Complemento (opcional)"
            help={errors.complemento?.message}
            validateStatus={errors.complemento ? 'error' : ''}
          >
            <StyledInput
              {...field}
              autoComplete="off"
              disabled={cepSearchLoading}
              value={field.value || ''}
              placeholder="Digite o complemento"
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
  mode
}: IUserRegistrationStep) => {
  return (
    <FormStep visible={visible ? 1 : 0}>
      <StyledDescriptions title="Resumo dos Dados" bordered column={1}>
        {mode === 'userCreation' && (
          <>
            <Descriptions.Item label="Modo de Criação">
              {formData.creationMode === 'fromScratch'
                ? 'Do Zero'
                : 'A partir de Eleitor'}
            </Descriptions.Item>
            <Descriptions.Item label="Cargo">
              {getRoleData(formData.role as UserRole).label}
            </Descriptions.Item>
          </>
        )}
        <Descriptions.Item label="Email">{formData.email}</Descriptions.Item>
        <Descriptions.Item label="Nome Completo">
          {formData.nomeCompleto}
        </Descriptions.Item>
        <Descriptions.Item label="CPF">{formData.cpf}</Descriptions.Item>
        <Descriptions.Item label="Data de Nascimento">
          {formData.dataNascimento}
        </Descriptions.Item>
        <Descriptions.Item label="Gênero">
          {getGenderLabel(formData.genero)}
        </Descriptions.Item>
        <Descriptions.Item label="Religião">
          {getReligionLabel(formData.religiao)}
        </Descriptions.Item>
        <Descriptions.Item label="Foto">
          {formData.foto || 'Não informado'}
        </Descriptions.Item>
        <Descriptions.Item label="Telefone">
          {formData.telefone || 'Não informado'}
        </Descriptions.Item>
        <Descriptions.Item label="WhatsApp">
          {formData.whatsapp}
        </Descriptions.Item>
        <Descriptions.Item label="Instagram">
          {formData.instagram || 'Não informado'}
        </Descriptions.Item>
        <Descriptions.Item label="Facebook">
          {formData.facebook || 'Não informado'}
        </Descriptions.Item>
        <Descriptions.Item label="CEP">{formData.cep}</Descriptions.Item>
        <Descriptions.Item label="Endereço">
          {formData.endereco}
        </Descriptions.Item>
        <Descriptions.Item label="Número">{formData.numero}</Descriptions.Item>
        <Descriptions.Item label="Complemento">
          {formData.complemento || 'Não informado'}
        </Descriptions.Item>
        <Descriptions.Item label="Bairro">{formData.bairro}</Descriptions.Item>
        <Descriptions.Item label="Cidade">{formData.cidade}</Descriptions.Item>
        <Descriptions.Item label="Estado">{formData.estado}</Descriptions.Item>
      </StyledDescriptions>
      {mode === 'firstAccess' ? (
        <>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Senha"
                help={errors.password?.message}
                validateStatus={errors.password ? 'error' : ''}
              >
                <StyledInput.Password
                  {...field}
                  placeholder="Digite sua senha"
                />
              </StyledForm.Item>
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Confirmar Senha"
                help={errors.confirmPassword?.message}
                validateStatus={errors.confirmPassword ? 'error' : ''}
              >
                <StyledInput.Password
                  {...field}
                  placeholder="Confirme sua senha"
                />
              </StyledForm.Item>
            )}
          />
        </>
      ) : (
        <Controller
          name="observacoes"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Observações (opcional)"
              help={errors.observacoes?.message}
              validateStatus={errors.observacoes ? 'error' : ''}
            >
              <TextArea
                {...field}
                rows={4}
                placeholder="Digite observações sobre o usuário/eleitor"
              />
            </StyledForm.Item>
          )}
        />
      )}
    </FormStep>
  )
}
