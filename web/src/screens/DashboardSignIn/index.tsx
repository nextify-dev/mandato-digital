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
import { UserRegistrationFormType } from '@/@types/user'
import { getInitialFormData } from '@/utils/functions/formData'

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
    firstAccessData
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
    if (!data.email) {
      throw new Error('Email é obrigatório para completar o registro.')
    }
    await completeRegistration(data.email, data, 'firstAccess', cityId)
  }

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setFirstAccess(e.target.checked)
    setValue('email', emailValue)
    setCurrentStep(0)
  }

  const handleEmailBlur = async () => {
    if (emailValue && yup.string().email().isValidSync(emailValue)) {
      await checkFirstAccess(emailValue)
    }
  }

  const getFirstAccessInitialData = (): Partial<UserRegistrationFormType> => {
    return firstAccessData
      ? getInitialFormData(firstAccessData)
      : { email: emailValue }
  }

  const handleBackToLogin = () => {
    setFirstAccess(false)
    setValue('email', '')
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
