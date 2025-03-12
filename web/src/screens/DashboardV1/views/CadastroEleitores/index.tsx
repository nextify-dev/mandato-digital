import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface ICadastroEleitoresView {}

const CadastroEleitoresView = ({}: ICadastroEleitoresView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      CadastroEleitoresView
    </View>
  )
}

export default CadastroEleitoresView
