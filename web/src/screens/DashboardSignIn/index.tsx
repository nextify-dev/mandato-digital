// src/screens/DashboardSignIn/index.tsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as S from './styles'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import UserRegistrationForm from '@/components/forms/UserRegistration'
import { useAuth } from '@/contexts/AuthProvider'
import {
  StyledForm,
  StyledButton,
  StyledInput,
  StyledCheckbox
} from '@/utils/styles/antd'
import { UserRegistrationFormType, User } from '@/@types/user'
import { convertToISODate } from '@/utils/functions/masks'

interface SignInForm {
  email: string
  password: string
}

const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Mínimo de 6 caracteres')
    .required('Senha é obrigatória')
})

const DashboardSignInScreen = () => {
  const {
    login,
    completeRegistration,
    isFirstAccess,
    isFirstAccessEligible,
    emailLocked,
    checkFirstAccess,
    setFirstAccess,
    firstAccessData // Adicionado para pegar os dados do primeiro acesso
  } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid }
  } = useForm<SignInForm>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const emailValue = watch('email')

  const onLoginSubmit = async (data: SignInForm) => {
    await login(data.email, data.password)
  }

  const onFirstAccessSubmit = async (data: UserRegistrationFormType) => {
    const cityId = firstAccessData?.cityId!
    await completeRegistration(data.email, data, 'firstAccess', cityId)
  }

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setFirstAccess(e.target.checked)
    setValue('email', emailValue)
    if (e.target.checked) {
      setCurrentStep(0)
    } else {
      setCurrentStep(0) // Reseta o passo ao voltar para o login
    }
  }

  const handleEmailBlur = async () => {
    if (emailValue && yup.string().email().isValidSync(emailValue)) {
      await checkFirstAccess(emailValue)
    }
  }

  // Preenche os dados do primeiro acesso quando disponíveis
  const getFirstAccessInitialData = (): Partial<UserRegistrationFormType> => {
    if (!firstAccessData || !firstAccessData.profile) {
      return { email: emailValue }
    }
    const profile = firstAccessData.profile
    return {
      email: firstAccessData.email,
      nomeCompleto: profile.nomeCompleto || '',
      cpf: profile.cpf || '',
      dataNascimento: profile.dataNascimento || '',
      genero: profile.genero || undefined,
      religiao: profile.religiao || undefined,
      foto: profile.foto || null,
      telefone: profile.telefone || null,
      whatsapp: profile.whatsapp || '',
      instagram: profile.instagram || null,
      facebook: profile.facebook || null,
      cep: profile.cep || '',
      endereco: profile.endereco || '',
      numero: profile.numero || '',
      complemento: profile.complemento || null,
      bairro: profile.bairro || '',
      cidade: profile.cidade || '',
      estado: profile.estado || '',
      cityId: firstAccessData.cityId || undefined,
      role: firstAccessData.role || undefined
    }
  }

  const handleBackToLogin = () => {
    setFirstAccess(false)
    setValue('email', '') // Limpa o email ao voltar
    setValue('password', '')
    setCurrentStep(0)
  }

  return (
    <S.DashboardSignInScreen>
      <S.SignInContainer active={isFirstAccess ? 1 : 0}>
        {isFirstAccess ? (
          <>
            <UserRegistrationForm
              onSubmit={onFirstAccessSubmit}
              initialData={getFirstAccessInitialData()}
              mode="firstAccess"
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
            <StyledButton
              onClick={handleBackToLogin}
              style={{ marginTop: '16px' }}
              block
            >
              Voltar para Login
            </StyledButton>
          </>
        ) : (
          <StyledForm onFinish={handleSubmit(onLoginSubmit)} layout="vertical">
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
                    onBlur={handleEmailBlur}
                    placeholder="Digite seu email"
                    disabled={emailLocked}
                  />
                </StyledForm.Item>
              )}
            />
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
            <StyledCheckbox
              checked={isFirstAccess}
              onChange={handleCheckboxChange}
              disabled={!isFirstAccessEligible}
            >
              Primeiro acesso?
            </StyledCheckbox>
            <StyledButton
              type="primary"
              htmlType="submit"
              disabled={!isValid}
              block
            >
              Entrar
            </StyledButton>
            <S.ForgotPasswordLink>
              <Link to="/esqueci-senha">Esqueci minha senha</Link>
            </S.ForgotPasswordLink>
          </StyledForm>
        )}
      </S.SignInContainer>
    </S.DashboardSignInScreen>
  )
}

export default DashboardSignInScreen
