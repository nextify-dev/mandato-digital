// src/components/forms/UserRegistration/index.tsx
import React, { useEffect, forwardRef, Ref } from 'react'
import * as S from './styles'
import { Steps, Select, Input } from 'antd'
import { Controller, UseFormReturn } from 'react-hook-form'
import {
  StyledForm,
  StyledInput,
  StyledButton,
  StyledSteps
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
  getRoleData,
  User,
  FormMode
} from '@/@types/user'
import { FormInputsWrapper, FormStep } from '@/utils/styles/commons'
import { fetchAddressByCep } from '@/utils/functions/geolocation'
import { useUsers } from '@/contexts/UsersProvider'
import { useModalForm } from '@/hooks/useModalForm'
import { DefaultValues } from 'react-hook-form'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { getInitialFormData } from '@/utils/functions/formData'

const { TextArea } = Input

interface UserRegistrationFormProps {
  onSubmit?: (
    data: UserRegistrationFormType & { cityId?: string }
  ) => Promise<void>
  initialData?: Partial<UserRegistrationFormType>
  userId?: string
  mode: FormMode
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

const UserRegistrationForm = forwardRef<
  UseFormReturn<UserRegistrationFormType>,
  UserRegistrationFormProps
>(
  (
    { onSubmit, initialData, userId, mode, currentStep, setCurrentStep },
    ref: Ref<UseFormReturn<UserRegistrationFormType>>
  ) => {
    const { voters, loading } = useUsers()
    const { user } = useAuth()
    const { cities } = useCities()
    const [filteredVoters, setFilteredVoters] = React.useState<User[]>([])
    const isEdition = !!initialData && mode !== 'firstAccess'

    const defaultValues: DefaultValues<UserRegistrationFormType> = initialData
      ? getInitialFormData(initialData)
      : {
          email: '',
          nomeCompleto: '',
          cpf: '',
          dataNascimento: '',
          genero: undefined,
          religiao: undefined,
          foto: null,
          telefone: null,
          whatsapp: '',
          instagram: null,
          facebook: null,
          cep: '',
          endereco: '',
          numero: '',
          complemento: null,
          bairro: '',
          cidade: '',
          estado: '',
          cityId: undefined,
          password: mode === 'firstAccess' ? '' : undefined,
          confirmPassword: mode === 'firstAccess' ? '' : undefined,
          observacoes: undefined,
          role: mode === 'userCreation' ? undefined : undefined, // Removemos UserRole.ELEITOR como padrão
          creationMode: undefined,
          voterId: undefined
        }

    const formMethods = useModalForm<UserRegistrationFormType>({
      schema: getUserRegistrationSchema(mode, isEdition, userId),
      defaultValues,
      onSubmit: async (data: UserRegistrationFormType) => {
        const cityId =
          user?.role === UserRole.ADMINISTRADOR_GERAL
            ? data.cityId ?? user?.cityId
            : user?.cityId
        if (onSubmit) {
          await onSubmit({ ...data, cityId })
        }
      }
    })

    React.useImperativeHandle(ref, () => formMethods)

    const {
      control,
      setValue,
      trigger,
      watch,
      setError,
      clearErrors,
      reset, // Adicionamos o reset ao destructuring
      formState: { errors, isValid }
    } = formMethods

    // Resetar o formulário quando mode ou initialData mudar
    useEffect(() => {
      reset(defaultValues)
    }, [mode, initialData, reset])

    const formData = watch()
    const creationMode = watch('creationMode') as
      | 'fromScratch'
      | 'fromVoter'
      | undefined

    useEffect(() => {
      if (mode === 'userCreation' && !isEdition) {
        const currentUserId = user?.id
        const voterList = voters.filter((voter) => voter.id !== currentUserId)
        setFilteredVoters(voterList)
      }
    }, [mode, voters, user, isEdition])

    const USER_ROLE_OPTIONS = Object.values(UserRole)
      .filter((role) => role !== UserRole.ELEITOR)
      .map((role) => ({
        label: getRoleData(role).label,
        value: role
      }))

    const VOTER_OPTIONS = filteredVoters.map((voter: User) => ({
      label: `${voter.profile?.nomeCompleto} (${voter.email})`,
      value: voter.id
    }))

    const CITY_OPTIONS = cities.map((city) => ({
      label: `${city.name} - ${city.state}`,
      value: city.id
    }))

    const steps = [
      ...(mode === 'userCreation' && !isEdition
        ? [
            {
              title: 'Modo de Criação',
              fields: ['creationMode', 'role', 'voterId'],
              requiredFields:
                creationMode === 'fromVoter'
                  ? ['creationMode', 'role', 'voterId']
                  : ['creationMode', 'role']
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
          'genero'
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
          'estado',
          'cityId'
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
            : ['observacoes'],
        requiredFields:
          mode === 'firstAccess' ? ['password', 'confirmPassword'] : []
      }
    ]

    const areRequiredFieldsValid = () => {
      const requiredFields = steps[currentStep]
        .requiredFields as (keyof UserRegistrationFormType)[]
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

    const handleSubmitClick = async () => {
      if ((await validateStep()) && onSubmit) {
        formMethods.handleSubmit((data: UserRegistrationFormType) => {
          const cityId =
            user?.role === UserRole.ADMINISTRADOR_GERAL
              ? formData.cityId ?? user?.cityId
              : user?.cityId
          return onSubmit({ ...data, cityId })
        })()
      }
    }

    const validateEmailUniqueness = async (email: string) => {
      if (isEdition || mode === 'firstAccess') return
      const isUnique = await authService.checkEmailUniqueness(email, userId)
      if (!isUnique) {
        setError('email', {
          type: 'manual',
          message: 'Este email já está registrado'
        })
      } else {
        clearErrors('email')
        await trigger('email')
      }
    }

    const validateCpfUniqueness = async (cpf: string) => {
      if (isEdition || mode === 'firstAccess') return
      const isUnique = await authService.checkCpfUniqueness(cpf, userId)
      if (!isUnique) {
        setError('cpf', {
          type: 'manual',
          message: 'Este CPF já está registrado'
        })
      } else {
        clearErrors('cpf')
        await trigger('cpf')
      }
    }

    const descriptionFields: DynamicDescriptionsField<UserRegistrationFormType>[] =
      [
        { key: 'email', label: 'Email' },
        { key: 'nomeCompleto', label: 'Nome Completo' },
        {
          key: 'cpf',
          label: 'CPF',
          render: (value) => (value ? applyMask(value, 'cpf') : '-')
        },
        {
          key: 'dataNascimento',
          label: 'Data de Nascimento',
          render: (value) => (value ? applyMask(value, 'birthDate') : '-')
        },
        {
          key: 'genero',
          label: 'Gênero',
          render: (value) => (value ? getGenderLabel(value) : '-')
        },
        {
          key: 'religiao',
          label: 'Religião',
          render: (value) => (value ? getReligionLabel(value) : '-')
        },
        { key: 'foto', label: 'Foto' },
        {
          key: 'telefone',
          label: 'Telefone',
          render: (value) => (value ? applyMask(value, 'phone') : '-')
        },
        {
          key: 'whatsapp',
          label: 'WhatsApp',
          render: (value) => (value ? applyMask(value, 'phone') : '-')
        },
        { key: 'instagram', label: 'Instagram' },
        { key: 'facebook', label: 'Facebook' },
        {
          key: 'cep',
          label: 'CEP',
          render: (value) => (value ? applyMask(value, 'cep') : '-')
        },
        { key: 'endereco', label: 'Endereço' },
        { key: 'numero', label: 'Número' },
        { key: 'complemento', label: 'Complemento' },
        { key: 'bairro', label: 'Bairro' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'estado', label: 'Estado' },
        {
          key: 'cityId',
          label: 'Cidade de Registro',
          render: (value) => {
            const city = cities.find((c) => c.id === value)
            return city ? `${city.name} - ${city.state}` : '-'
          }
        },
        { key: 'observacoes', label: 'Observações' }
      ]

    const renderViewOnlyMode = () => {
      const viewFields = [
        ...(mode === 'userCreation' && initialData?.role !== UserRole.ELEITOR
          ? [
              {
                key: 'role',
                label: 'Cargo',
                render: (value: UserRole) => getRoleData(value).label
              }
            ]
          : []),
        ...descriptionFields.filter(
          (field) =>
            initialData?.[field.key as keyof UserRegistrationFormType] !==
            undefined
        )
      ]

      return (
        <DynamicDescriptions
          data={initialData ?? {}}
          fields={viewFields}
          title="Detalhes do Usuário/Eleitor"
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
        <S.UserRegistrationFormContent>
          {mode === 'userCreation' && !isEdition && (
            <CreationModeStep
              control={control}
              errors={errors}
              setValue={setValue}
              visible={currentStep === 0}
              roleOptions={USER_ROLE_OPTIONS}
              voterOptions={VOTER_OPTIONS}
              voters={filteredVoters}
              creationMode={creationMode}
              loadingVoters={loading}
              trigger={trigger}
            />
          )}
          <DadosPessoaisStep
            control={control}
            errors={errors}
            setValue={setValue}
            mode={mode}
            visible={
              currentStep === (mode === 'userCreation' && !isEdition ? 1 : 0)
            }
            isEdition={isEdition}
            validateEmailUniqueness={validateEmailUniqueness}
            validateCpfUniqueness={validateCpfUniqueness}
            creationMode={creationMode} // Passamos o creationMode
          />
          <ContatoStep
            control={control}
            errors={errors}
            setValue={setValue}
            visible={
              currentStep === (mode === 'userCreation' && !isEdition ? 2 : 1)
            }
          />
          <EnderecoStep
            control={control}
            errors={errors}
            setValue={setValue}
            trigger={trigger}
            visible={
              currentStep === (mode === 'userCreation' && !isEdition ? 3 : 2)
            }
            isAdminGeral={user?.role === UserRole.ADMINISTRADOR_GERAL}
            cityOptions={CITY_OPTIONS}
          />
          <ReviewStep
            control={control}
            errors={errors}
            setValue={setValue}
            formData={formData}
            mode={mode}
            visible={
              currentStep === (mode === 'userCreation' && !isEdition ? 4 : 3)
            }
            descriptionFields={descriptionFields}
          />
        </S.UserRegistrationFormContent>
        <S.UserRegistrationFormFooter>
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
              {isEdition ? 'Atualizar Cadastro' : 'Completar Cadastro'}
            </StyledButton>
          )}
        </S.UserRegistrationFormFooter>
      </StyledForm>
    )
  }
)

UserRegistrationForm.displayName = 'UserRegistrationForm'
export default UserRegistrationForm

interface IUserRegistrationStep {
  control: any
  errors: any
  setValue: any
  formData?: any
  trigger?: any
  visible: boolean
  mode?: FormMode
  roleOptions?: { label: string; value: UserRole }[]
  voterOptions?: { label: string; value: string }[]
  voters?: User[]
  creationMode?: 'fromScratch' | 'fromVoter' | undefined
  loadingVoters?: boolean
  isEdition?: boolean
  descriptionFields?: DynamicDescriptionsField<UserRegistrationFormType>[]
  validateEmailUniqueness?: (email: string) => Promise<void>
  validateCpfUniqueness?: (cpf: string) => Promise<void>
  isAdminGeral?: boolean
  cityOptions?: { label: string; value: string }[]
}

const CreationModeStep = ({
  control,
  errors,
  setValue,
  visible,
  roleOptions,
  voterOptions,
  voters,
  creationMode,
  loadingVoters,
  trigger
}: IUserRegistrationStep) => {
  const handleVoterSelect = (voterId: string) => {
    const selectedVoter = voters?.find((voter) => voter.id === voterId)
    if (selectedVoter) {
      const initialData = getInitialFormData(selectedVoter)
      // Preservar os valores atuais de creationMode e role
      const currentCreationMode = creationMode
      const currentRole = control._formValues.role

      // Aplicar os dados do eleitor
      Object.entries(initialData).forEach(([key, value]) => {
        if (key !== 'creationMode' && key !== 'role') {
          // Evitar sobrescrever creationMode e role
          setValue(key as keyof UserRegistrationFormType, value)
        }
      })

      // Restaurar os valores originais de creationMode e role
      setValue('creationMode', currentCreationMode)
      setValue('role', currentRole)
      setValue('voterId', voterId)

      // Validar apenas os campos da etapa atual
      trigger(['creationMode', 'role', 'voterId'])
    }
  }

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
                { label: 'Do zero', value: 'fromScratch' },
                { label: 'A partir de eleitor', value: 'fromVoter' }
              ]}
              onChange={(value) => {
                setValue('creationMode', value)
                if (value === 'fromScratch') {
                  setValue('voterId', undefined)
                  setValue('email', '')
                  setValue('nomeCompleto', '')
                  setValue('cpf', '')
                  setValue('dataNascimento', '')
                  setValue('genero', undefined)
                  setValue('religiao', undefined)
                  setValue('foto', null)
                  setValue('telefone', null)
                  setValue('whatsapp', '')
                  setValue('instagram', null)
                  setValue('facebook', null)
                  setValue('cep', '')
                  setValue('endereco', '')
                  setValue('numero', '')
                  setValue('complemento', null)
                  setValue('bairro', '')
                  setValue('cidade', '')
                  setValue('estado', '')
                }
              }}
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
      {creationMode === 'fromVoter' && (
        <Controller
          name="voterId"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Selecionar Eleitor"
              help={errors.voterId?.message}
              validateStatus={errors.voterId ? 'error' : ''}
            >
              <Select
                {...field}
                showSearch
                placeholder="Pesquise e selecione um eleitor"
                optionFilterProp="label"
                options={voterOptions}
                onChange={(value) => {
                  setValue('voterId', value)
                  handleVoterSelect(value)
                }}
                value={field.value}
                loading={loadingVoters}
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </StyledForm.Item>
          )}
        />
      )}
    </FormStep>
  )
}

const DadosPessoaisStep = ({
  control,
  errors,
  setValue,
  visible,
  mode,
  isEdition,
  validateEmailUniqueness,
  validateCpfUniqueness,
  creationMode // Adicione este prop ao interface
}: IUserRegistrationStep) => {
  const isFromVoter =
    mode === 'userCreation' && creationMode === 'fromVoter' && !isEdition

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
              disabled={isEdition || mode === 'firstAccess' || isFromVoter}
              onBlur={(e) =>
                !isFromVoter && validateEmailUniqueness!(e.target.value)
              }
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
                disabled={isEdition || mode === 'firstAccess' || isFromVoter}
                onBlur={(e) =>
                  !isFromVoter && validateCpfUniqueness!(e.target.value)
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
  trigger,
  isAdminGeral,
  cityOptions
}: IUserRegistrationStep) => {
  const [cepSearchLoading, setCepSearchLoading] = React.useState(false)

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
      {isAdminGeral && (
        <Controller
          name="cityId"
          control={control}
          render={({ field }) => (
            <StyledForm.Item
              label="Cidade de Registro"
              help={errors.cityId?.message}
              validateStatus={errors.cityId ? 'error' : ''}
            >
              <Select
                {...field}
                placeholder="Selecione a cidade"
                options={cityOptions}
                onChange={(value) => setValue('cityId', value)}
                value={field.value}
              />
            </StyledForm.Item>
          )}
        />
      )}
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
  mode,
  descriptionFields
}: IUserRegistrationStep) => {
  const reviewFields = [
    ...(mode === 'userCreation' && formData.role !== UserRole.ELEITOR
      ? [
          {
            key: 'role',
            label: 'Cargo',
            render: (value: UserRole) => getRoleData(value).label
          }
        ]
      : []),
    ...(descriptionFields || []).filter((field) =>
      [
        'email',
        'nomeCompleto',
        'cpf',
        'dataNascimento',
        'genero',
        'religiao',
        'foto',
        'telefone',
        'whatsapp',
        'instagram',
        'facebook',
        'cep',
        'endereco',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'estado',
        'cityId'
      ].includes(field.key as string)
    )
  ]

  return (
    <FormStep visible={visible ? 1 : 0}>
      <DynamicDescriptions
        data={formData}
        fields={reviewFields}
        title="Resumo dos Dados"
      />
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
