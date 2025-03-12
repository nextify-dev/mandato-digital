import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IGestaoCidadesView {}

const GestaoCidadesView = ({}: IGestaoCidadesView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      GestaoCidadesView
    </View>
  )
}

export default GestaoCidadesView
