import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IRelatoriosView {}

const RelatoriosView = ({}: IRelatoriosView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      RelatoriosView
    </View>
  )
}

export default RelatoriosView
