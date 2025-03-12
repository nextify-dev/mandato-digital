import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IDemandasEleitoraisView {}

const DemandasEleitoraisView = ({}: IDemandasEleitoraisView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      DemandasEleitoraisView
    </View>
  )
}

export default DemandasEleitoraisView
