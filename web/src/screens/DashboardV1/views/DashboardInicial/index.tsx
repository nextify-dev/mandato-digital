import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IDashboardInicialView {}

const DashboardInicialView = ({}: IDashboardInicialView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      DashboardInicialView
    </View>
  )
}

export default DashboardInicialView
