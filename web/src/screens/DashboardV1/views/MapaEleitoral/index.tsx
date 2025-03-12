import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IMapaEleitoralView {}

const MapaEleitoralView = ({}: IMapaEleitoralView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      MapaEleitoralView
    </View>
  )
}

export default MapaEleitoralView
