// src/screens/DashboardV1/views/SegmentacaoEleitores/index.tsx

import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface ISegmentacaoEleitoresView {}

const SegmentacaoEleitoresView = ({}: ISegmentacaoEleitoresView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      SegmentacaoEleitoresView
    </View>
  )
}

export default SegmentacaoEleitoresView
