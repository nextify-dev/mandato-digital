import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IPlanejamentoView {}

const PlanejamentoView = ({}: IPlanejamentoView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      PlanejamentoView
    </View>
  )
}

export default PlanejamentoView
