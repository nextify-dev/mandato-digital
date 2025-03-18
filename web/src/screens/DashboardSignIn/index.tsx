// src/screens/DashboardSignIn/index.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as S from './styles'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import UserRegistrationForm from '@/components/forms/UserRegistration'
import { useAuth } from '@/contexts/AuthProvider'
import { StyledForm, StyledButton, StyledInput } from '@/utils/styles/antd'
import { UserRegistrationFormType } from '@/@types/user'
import { getInitialFormData } from '@/utils/functions/formData'
import { LuArrowLeft } from 'react-icons/lu'

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
    firstAccessData,
    isEmailUnauthorized // Nova propriedade adicionada
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
    if (isFirstAccessEligible && !isFirstAccess) {
      setFirstAccess(true)
      setCurrentStep(0)
    } else if (!isFirstAccess) {
      await login(data.email, data.password)
    }
  }

  const onFirstAccessSubmit = async (data: UserRegistrationFormType) => {
    const cityId = firstAccessData?.cityId!
    if (!data.email) {
      throw new Error('Email é obrigatório para completar o registro.')
    }
    await completeRegistration(data.email, data, 'firstAccess', cityId)
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
        <S.SignInFormLogo>
          <img src="/logos/logo_mandato_full.png" alt="" />
        </S.SignInFormLogo>
        {isFirstAccess ? (
          <>
            <UserRegistrationForm
              onSubmit={onFirstAccessSubmit}
              initialData={getFirstAccessInitialData()}
              mode="firstAccess"
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
            <S.BackToLoginButton
              onClick={handleBackToLogin}
              icon={<LuArrowLeft />}
              size="small"
            >
              Voltar
            </S.BackToLoginButton>
          </>
        ) : (
          <StyledForm onFinish={handleSubmit(onLoginSubmit)} layout="vertical">
            <S.SignInFormContent>
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
            </S.SignInFormContent>
            <S.SignInFormFooter>
              <StyledButton
                type="primary"
                htmlType="submit"
                disabled={!isValid || isEmailUnauthorized} // Desabilita se o e-mail não estiver autorizado
                block
              >
                {isFirstAccessEligible ? 'Primeiro Acesso' : 'Entrar'}
              </StyledButton>
            </S.SignInFormFooter>
          </StyledForm>
        )}
        <S.ForgotPasswordLink>
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </S.ForgotPasswordLink>
      </S.SignInContainer>
    </S.DashboardSignInScreen>
  )
}

export default DashboardSignInScreen
