// src/screens/ForgotPassword.tsx

import * as S from './styles'

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { useAuth } from '@/contexts/AuthProvider'
import {
  StyledForm,
  StyledButton,
  StyledInput,
  StyledAlert
} from '@/utils/styles/antd'

interface ForgotPasswordForm {
  email: string
}

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório')
})

const ForgotPasswordScreen = () => {
  const { resetPassword, message } = useAuth()
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await resetPassword(data.email)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <S.ForgotPasswordScreen>
      <S.ForgotPasswordContainer>
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
          <StyledButton type="primary" htmlType="submit" block>
            Enviar Email de Redefinição
          </StyledButton>
        </StyledForm>
      </S.ForgotPasswordContainer>
    </S.ForgotPasswordScreen>
  )
}

export default ForgotPasswordScreen
