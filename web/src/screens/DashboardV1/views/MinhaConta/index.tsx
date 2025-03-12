import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IMinhaContaView {}

const MinhaContaView = ({}: IMinhaContaView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      MinhaContaView
    </View>
  )
}

export default MinhaContaView
