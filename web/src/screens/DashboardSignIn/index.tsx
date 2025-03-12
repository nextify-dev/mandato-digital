// src/screens/DashboardSignIn/index.tsx

import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import * as S from './styles'

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { CheckboxChangeEvent } from 'antd/es/checkbox'

import { UserRegistrationForm } from '@/components'
import { useAuth } from '@/contexts/AuthProvider'
import {
  StyledForm,
  StyledButton,
  StyledInput,
  StyledCheckbox
} from '@/utils/styles/antd'
import { FirstAccessForm } from '@/@types/user'

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
    setFirstAccess
  } = useAuth()

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

  const onFirstAccessSubmit = async (data: FirstAccessForm) => {
    await completeRegistration(data.email, data)
  }

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setFirstAccess(e.target.checked)
    setValue('email', emailValue)
  }

  return (
    <S.DashboardSignInScreen>
      <S.SignInContainer active={isFirstAccess ? 1 : 0}>
        {isFirstAccess ? (
          <UserRegistrationForm
            onSubmit={onFirstAccessSubmit}
            initialData={{ email: emailValue }}
          />
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
                    onBlur={() => {
                      if (
                        emailValue &&
                        yup.string().email().isValidSync(emailValue)
                      ) {
                        checkFirstAccess(emailValue)
                      }
                    }}
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
