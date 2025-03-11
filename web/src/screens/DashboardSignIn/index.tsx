// src/screens/DashboardSignIn.tsx

import { useState } from 'react'
import { Link } from 'react-router-dom'

import * as S from './styles'

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useAuth } from '@/contexts/AuthProvider'
import {
  StyledForm,
  StyledCheckbox,
  StyledButton,
  StyledInput,
  StyledAlert
} from '@/utils/styles/antd'
import { masks, applyMask } from '@/utils/functions/masks'

interface LoginForm {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Mínimo de 6 caracteres')
    .required('Senha é obrigatória'),
  firstName: yup.string().when('$isFirstAccess', {
    is: true,
    then: (schema) => schema.required('Nome é obrigatório'),
    otherwise: (schema) => schema.notRequired()
  }),
  lastName: yup.string().when('$isFirstAccess', {
    is: true,
    then: (schema) => schema.required('Sobrenome é obrigatório'),
    otherwise: (schema) => schema.notRequired()
  }),
  phone: yup.string().when('$isFirstAccess', {
    is: true,
    then: (schema) =>
      schema.min(14, 'Telefone inválido').required('Telefone é obrigatório'),
    otherwise: (schema) => schema.notRequired()
  })
})

const DashboardSignInScreen = () => {
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const { login, completeRegistration, message } = useAuth()
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
    context: { isFirstAccess }
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      if (isFirstAccess) {
        await completeRegistration(data.email, {
          firstName: data.firstName!,
          lastName: data.lastName!,
          phone: data.phone!,
          password: data.password
        })
      } else {
        await login(data.email, data.password)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <S.DashboardSignInScreen>
      <S.SignInContainer>
        {message && (
          <StyledAlert message={message.text} type={message.type} showIcon />
        )}
        <StyledForm onFinish={handleSubmit(onSubmit)} layout="vertical">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Email"
                help={errors.email?.message}
                validateStatus={errors.email ? 'error' : ''}
              >
                <StyledInput {...field} placeholder="Digite seu email" />
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
          {isFirstAccess && (
            <>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Nome"
                    help={errors.firstName?.message}
                    validateStatus={errors.firstName ? 'error' : ''}
                  >
                    <StyledInput {...field} placeholder="Digite seu nome" />
                  </StyledForm.Item>
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Sobrenome"
                    help={errors.lastName?.message}
                    validateStatus={errors.lastName ? 'error' : ''}
                  >
                    <StyledInput
                      {...field}
                      placeholder="Digite seu sobrenome"
                    />
                  </StyledForm.Item>
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Telefone"
                    help={errors.phone?.message}
                    validateStatus={errors.phone ? 'error' : ''}
                  >
                    <StyledInput
                      {...field}
                      placeholder="(99) 99999-9999"
                      onChange={(e) => {
                        const maskedValue = applyMask(e.target.value, 'phone')
                        setValue('phone', maskedValue)
                      }}
                    />
                  </StyledForm.Item>
                )}
              />
            </>
          )}
          <StyledCheckbox
            checked={isFirstAccess}
            onChange={(e) => setIsFirstAccess(e.target.checked)}
          >
            Primeiro acesso?
          </StyledCheckbox>
          <StyledButton type="primary" htmlType="submit" block>
            {isFirstAccess ? 'Completar Cadastro' : 'Entrar'}
          </StyledButton>
          <S.ForgotPasswordLink>
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </S.ForgotPasswordLink>
        </StyledForm>
      </S.SignInContainer>
    </S.DashboardSignInScreen>
  )
}

export default DashboardSignInScreen
