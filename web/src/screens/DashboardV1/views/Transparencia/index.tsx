import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface ITransparenciaView {}

const TransparenciaView = ({}: ITransparenciaView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      TransparenciaView
    </View>
  )
}

export default TransparenciaView
