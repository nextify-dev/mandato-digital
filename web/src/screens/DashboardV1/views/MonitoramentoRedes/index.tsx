import * as S from './styles'

import { Button } from 'antd'

import { View } from '@/components'

interface IMonitoramentoRedesView {}

const MonitoramentoRedesView = ({}: IMonitoramentoRedesView) => {
  return (
    <View
      header={
        <>
          <div></div>
          <Button type="primary">Teste</Button>
        </>
      }
    >
      MonitoramentoRedesView
    </View>
  )
}

export default MonitoramentoRedesView
