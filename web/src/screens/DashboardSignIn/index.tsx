// src/screens/DashboardSignIn.tsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as S from './styles'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FirstAccessSchema, FirstAccessForm } from '@/@types/user'
import { useAuth } from '@/contexts/AuthProvider'
import { authService } from '@/services/auth'
import {
  StyledForm,
  StyledButton,
  StyledInput,
  StyledAlert,
  StyledCheckbox
} from '@/utils/styles/antd'
import { masks, applyMask } from '@/utils/functions/masks'
import * as yup from 'yup'
import { CheckboxChangeEvent } from 'antd/es/checkbox'

// Interface combinada para Login e FirstAccess
interface SignInForm extends Partial<FirstAccessForm> {
  email: string
  password: string
}

// Schema base para login
const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Mínimo de 6 caracteres')
    .required('Senha é obrigatória')
})

// Schema dinâmico baseado em isFirstAccess
const getSchema = (isFirstAccess: boolean) =>
  isFirstAccess ? FirstAccessSchema : loginSchema

const DashboardSignInScreen = () => {
  const [isFirstAccess, setIsFirstAccess] = useState(false)
  const [emailLocked, setEmailLocked] = useState(false)
  const [isFirstAccessEligible, setIsFirstAccessEligible] = useState(false) // Novo estado para elegibilidade
  const { login, completeRegistration } = useAuth()

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors, isValid, isDirty }
  } = useForm<SignInForm>({
    resolver: yupResolver(getSchema(isFirstAccess)),
    mode: 'onBlur', // Validação ao sair do campo
    defaultValues: {
      email: '',
      password: '',
      nomeCompleto: '',
      cpf: '',
      dataNascimento: '',
      genero: '',
      whatsapp: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      confirmPassword: ''
    }
  })

  const emailValue = watch('email') // Monitora o valor do email em tempo real

  // Função para buscar dados do usuário com base no email
  const fetchUserData = async (email: string) => {
    try {
      const userData = await authService.getUserData(email.replace('.', '_'))
      if (userData && userData.access.isFirstAccess) {
        setIsFirstAccessEligible(true) // Email é elegível para primeiro acesso
        const { profile } = userData
        if (profile) {
          reset({
            ...getValues(),
            nomeCompleto: profile.nomeCompleto || '',
            cpf: profile.cpf || '',
            dataNascimento: profile.dataNascimento || '',
            genero: profile.genero || '',
            whatsapp: profile.whatsapp || '',
            cep: profile.cep || '',
            endereco: profile.endereco || '',
            numero: profile.numero || '',
            bairro: profile.bairro || '',
            cidade: profile.cidade || '',
            estado: profile.estado || ''
          })
        }
      } else {
        setIsFirstAccessEligible(false) // Email não é elegível
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      setIsFirstAccessEligible(false)
    }
  }

  // Efeito para verificar o email e atualizar elegibilidade
  useEffect(() => {
    const email = emailValue
    if (email && yup.string().email().isValidSync(email)) {
      fetchUserData(email)
      if (isFirstAccess) {
        setEmailLocked(true) // Bloqueia o email se isFirstAccess estiver ativo
      }
    } else {
      setIsFirstAccessEligible(false)
      setEmailLocked(false)
      setIsFirstAccess(false) // Reseta isFirstAccess se o email não for válido
    }
  }, [emailValue, isFirstAccess])

  const onSubmit = async (data: SignInForm) => {
    try {
      if (isFirstAccess) {
        await completeRegistration(data.email, data as FirstAccessForm)
      } else {
        await login(data.email, data.password)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked
    const email = getValues('email')

    if (checked && !isFirstAccessEligible) {
      return // Não permite ativar se o email não for elegível
    }

    setIsFirstAccess(checked)
    if (!checked) {
      setEmailLocked(false) // Desbloqueia o email ao desmarcar
    } else {
      setEmailLocked(true) // Bloqueia o email ao marcar
    }
  }

  return (
    <S.DashboardSignInScreen>
      <S.SignInContainer>
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
                <StyledInput
                  {...field}
                  placeholder="Digite seu email"
                  disabled={emailLocked && isFirstAccess}
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
          {isFirstAccess && (
            <>
              <Controller
                name="nomeCompleto"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Nome Completo"
                    help={errors.nomeCompleto?.message}
                    validateStatus={errors.nomeCompleto ? 'error' : ''}
                  >
                    <StyledInput
                      {...field}
                      placeholder="Digite seu nome completo"
                    />
                  </StyledForm.Item>
                )}
              />
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
                    <StyledInput {...field} placeholder="YYYY-MM-DD" />
                  </StyledForm.Item>
                )}
              />
              <Controller
                name="genero"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Gênero"
                    help={errors.genero?.message}
                    validateStatus={errors.genero ? 'error' : ''}
                  >
                    <StyledInput {...field} placeholder="Digite seu gênero" />
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
                      placeholder="(00) 0 0000 0000"
                      onChange={(e) =>
                        setValue('whatsapp', applyMask(e.target.value, 'phone'))
                      }
                    />
                  </StyledForm.Item>
                )}
              />
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="CEP"
                    help={errors.cep?.message}
                    validateStatus={errors.cep ? 'error' : ''}
                  >
                    <StyledInput
                      {...field}
                      placeholder="00000-000"
                      onChange={(e) =>
                        setValue('cep', applyMask(e.target.value, 'cep'))
                      }
                    />
                  </StyledForm.Item>
                )}
              />
              <Controller
                name="endereco"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Endereço"
                    help={errors.endereco?.message}
                    validateStatus={errors.endereco ? 'error' : ''}
                  >
                    <StyledInput {...field} placeholder="Digite seu endereço" />
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
                  >
                    <StyledInput {...field} placeholder="Digite o número" />
                  </StyledForm.Item>
                )}
              />
              <Controller
                name="bairro"
                control={control}
                render={({ field }) => (
                  <StyledForm.Item
                    label="Bairro"
                    help={errors.bairro?.message}
                    validateStatus={errors.bairro ? 'error' : ''}
                  >
                    <StyledInput {...field} placeholder="Digite o bairro" />
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
                    <StyledInput {...field} placeholder="Digite a cidade" />
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
                    <StyledInput {...field} placeholder="Digite o estado" />
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
          )}
          <StyledCheckbox
            checked={isFirstAccess}
            onChange={handleCheckboxChange}
            disabled={
              !isFirstAccessEligible || (!isValid && !isFirstAccess && !isDirty)
            }
          >
            Primeiro acesso?
          </StyledCheckbox>
          <StyledButton
            type="primary"
            htmlType="submit"
            disabled={!isValid}
            block
          >
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
