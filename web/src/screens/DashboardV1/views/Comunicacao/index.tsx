// src/screens/DashboardV1/views/Comunicacao/index.tsx

import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IComunicacaoView {}

const ComunicacaoView = ({}: IComunicacaoView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      ComunicacaoView
    </View>
  )
}

export default ComunicacaoView
