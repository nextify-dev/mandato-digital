// src/hooks/useModalForm.tsx

import {
  FieldValues,
  UseFormReturn,
  useForm,
  DefaultValues
} from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

interface UseModalFormOptions<T extends FieldValues> {
  schema: yup.ObjectSchema<any>
  defaultValues: DefaultValues<T>
  onSubmit?: (data: T) => Promise<void>
}

/**
 * Hook personalizado para gerenciar formulários dentro de modais.
 */
export function useModalForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit
}: UseModalFormOptions<T>): UseFormReturn<T> & {
  handleFormSubmit: () => void
} {
  const formMethods = useForm<T>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
    defaultValues
  })

  const { handleSubmit } = formMethods

  // Função para lidar com a submissão do formulário
  const handleFormSubmit = handleSubmit(async (data) => {
    if (!onSubmit) return
    await onSubmit(data)
  })

  return {
    ...formMethods,
    handleFormSubmit
  }
}
