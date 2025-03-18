// src/components/forms/VisitRegistrationForm/index.tsx
import React, { forwardRef, Ref, useEffect, useMemo, useState } from 'react'
import { Controller, UseFormReturn, DefaultValues } from 'react-hook-form'
import { Select, DatePicker, Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import moment from 'moment'
import { StyledForm, StyledButton } from '@/utils/styles/antd'
import { FormStep } from '@/utils/styles/commons'
import { useModalForm } from '@/hooks/useModalForm'
import {
  VisitReason,
  VisitRegistrationFormType,
  getVisitRegistrationSchema
} from '@/@types/visit'
import { useUsers } from '@/contexts/UsersProvider'
import DynamicDescriptions, {
  DynamicDescriptionsField
} from '@/components/DynamicDescriptions'
import { IAdminOption } from '@/data/options'
import { citiesService } from '@/services/cities'

interface VisitRegistrationFormProps {
  onSubmit?: (data: VisitRegistrationFormType) => Promise<void>
  initialData?: Partial<VisitRegistrationFormType>
  mode: 'create' | 'edit' | 'viewOnly'
}

const VisitRegistrationForm = forwardRef<
  UseFormReturn<VisitRegistrationFormType>,
  VisitRegistrationFormProps
>(
  (
    { onSubmit, initialData, mode },
    ref: Ref<UseFormReturn<VisitRegistrationFormType>>
  ) => {
    const { users, voters, allUsers, loading: usersLoading } = useUsers()

    const [votersOptions, setVotersOptions] = useState<IAdminOption[]>([])
    const [allUsersOptions, setAllUsersOptions] = useState<IAdminOption[]>([])

    const defaultValues: DefaultValues<VisitRegistrationFormType> = {
      voterId: '',
      dateTime: moment().format('DD/MM/YYYY HH:mm'),
      reason: VisitReason.REQUEST,
      relatedUserId: '',
      documents: null
    }

    const formMethods = useModalForm<VisitRegistrationFormType>({
      schema: getVisitRegistrationSchema(),
      defaultValues: initialData || defaultValues,
      onSubmit
    })

    React.useImperativeHandle(ref, () => formMethods)

    const {
      control,
      setValue,
      reset,
      formState: { errors, isSubmitting, isValid }
    } = formMethods

    useEffect(() => {
      if (initialData) {
        reset({ ...defaultValues, ...initialData })
      }
    }, [initialData, reset])

    // Função auxiliar para obter o label do motivo da visita
    const getVisitReasonLabel = (reason: string) => {
      return (
        Object.entries(VisitReason).find(([_, value]) => {
          value === reason
        }) || reason
      )
    }

    useEffect(() => {
      const fetchUserOptions = async () => {
        const allUsersData = await Promise.all(
          [...users, ...voters].map(async (user) => {
            const cities = await citiesService.getCities({})
            const city = cities.find((c) => c.id === user.cityId)
            return {
              label: `${user.profile?.nomeCompleto || 'Sem Nome'} - ${
                city?.name || 'N/A'
              }, ${city?.state || 'N/A'}`,
              value: user.id
            }
          })
        )
        const votersData = await Promise.all(
          voters.map(async (user) => {
            const cities = await citiesService.getCities({})
            const city = cities.find((c) => c.id === user.cityId)
            return {
              label: `${user.profile?.nomeCompleto || 'Sem Nome'} - ${
                city?.name || 'N/A'
              }, ${city?.state || 'N/A'}`,
              value: user.id
            }
          })
        )
        setAllUsersOptions(allUsersData)
        setVotersOptions(votersData)
      }
      fetchUserOptions()
    }, [users, voters])

    // Opções para motivos da visita (reason)
    const REASON_OPTIONS = Object.values(VisitReason).map((reason) => ({
      label: getVisitReasonLabel(reason),
      value: reason
    }))

    // Definição dos campos para DynamicDescriptions no modo viewOnly
    const descriptionFields: DynamicDescriptionsField<VisitRegistrationFormType>[] =
      [
        {
          key: 'voterId',
          label: 'Eleitor',
          render: (value) =>
            allUsers.find((u) => u.id === value)?.profile?.nomeCompleto ||
            value ||
            '-'
        },
        {
          key: 'dateTime',
          label: 'Data e Horário',
          render: (value) => value || '-'
        },
        {
          key: 'reason',
          label: 'Motivo',
          render: (value) => (value ? getVisitReasonLabel(value) : '-')
        },
        {
          key: 'relatedUserId',
          label: 'Vinculado a',
          render: (value) =>
            allUsers.find((u) => u.id === value)?.profile?.nomeCompleto ||
            value ||
            '-'
        },
        {
          key: 'documents',
          label: 'Documentos',
          render: (value) =>
            Array.isArray(value) && value.length > 0
              ? `${value.length} anexos`
              : 'Nenhum'
        }
      ]

    if (mode === 'viewOnly') {
      return (
        <DynamicDescriptions
          data={initialData || {}}
          fields={descriptionFields}
          title="Detalhes da Visita"
        />
      )
    }

    return (
      <StyledForm onFinish={formMethods.handleSubmit} layout="vertical">
        <FormStep visible={1}>
          <Controller
            name="voterId"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Eleitor"
                help={errors.voterId?.message}
                validateStatus={errors.voterId ? 'error' : ''}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Pesquise e selecione um eleitor"
                  loading={usersLoading}
                  onChange={(value) => setValue('voterId', value)}
                  value={field.value}
                  options={votersOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </StyledForm.Item>
            )}
          />

          <Controller
            name="dateTime"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Data e Horário"
                help={errors.dateTime?.message}
                validateStatus={errors.dateTime ? 'error' : ''}
              >
                <DatePicker
                  format="DD/MM/YYYY HH:mm"
                  showTime={{ format: 'HH:mm' }}
                  onChange={(date) =>
                    setValue(
                      'dateTime',
                      date ? date.format('DD/MM/YYYY HH:mm') : ''
                    )
                  }
                  value={
                    field.value ? moment(field.value, 'DD/MM/YYYY HH:mm') : null
                  }
                />
              </StyledForm.Item>
            )}
          />

          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Motivo da Visita"
                help={errors.reason?.message}
                validateStatus={errors.reason ? 'error' : ''}
              >
                <Select
                  {...field}
                  placeholder="Selecione o motivo da visita"
                  onChange={(value) => setValue('reason', value)}
                  value={field.value}
                  options={REASON_OPTIONS}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </StyledForm.Item>
            )}
          />

          <Controller
            name="relatedUserId"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Vincular a Usuário"
                help={errors.relatedUserId?.message}
                validateStatus={errors.relatedUserId ? 'error' : ''}
              >
                <Select
                  {...field}
                  showSearch
                  placeholder="Pesquise e selecione um usuário"
                  loading={usersLoading}
                  onChange={(value) => setValue('relatedUserId', value)}
                  value={field.value}
                  options={allUsersOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </StyledForm.Item>
            )}
          />

          <Controller
            name="documents"
            control={control}
            render={({ field }) => (
              <StyledForm.Item
                label="Documentos"
                help={errors.documents?.message}
                validateStatus={errors.documents ? 'error' : ''}
              >
                <Upload
                  multiple
                  beforeUpload={() => false}
                  onChange={({ fileList }) =>
                    setValue(
                      'documents',
                      fileList.map((f) => f.originFileObj as File)
                    )
                  }
                  fileList={field.value?.map((file: any, index: number) => ({
                    uid: `${index}`,
                    name: file.name || 'Arquivo',
                    status: 'done',
                    originFileObj: file
                  }))}
                >
                  <Button icon={<UploadOutlined />}>Anexar Documentos</Button>
                </Upload>
              </StyledForm.Item>
            )}
          />
        </FormStep>

        <div style={{ textAlign: 'right' }}>
          <StyledButton
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={!isValid}
          >
            {mode === 'edit' ? 'Atualizar Visita' : 'Registrar Visita'}
          </StyledButton>
        </div>
      </StyledForm>
    )
  }
)

VisitRegistrationForm.displayName = 'VisitRegistrationForm'
export default VisitRegistrationForm
