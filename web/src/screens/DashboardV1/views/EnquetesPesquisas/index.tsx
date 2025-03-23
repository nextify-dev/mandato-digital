// src/screens/DashboardV1/views/EnquetesPesquisas/index.tsx

import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IEnquetesPesquisasView {}

const EnquetesPesquisasView = ({}: IEnquetesPesquisasView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      EnquetesPesquisasView
    </View>
  )
}

export default EnquetesPesquisasView
