import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IRegistroVisitasView {}

const RegistroVisitasView = ({}: IRegistroVisitasView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      RegistroVisitasView
    </View>
  )
}

export default RegistroVisitasView
