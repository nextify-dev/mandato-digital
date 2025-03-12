import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IGestaoUsuariosView {}

const GestaoUsuariosView = ({}: IGestaoUsuariosView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      GestaoUsuariosView
    </View>
  )
}

export default GestaoUsuariosView
