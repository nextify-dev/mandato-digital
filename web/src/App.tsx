// src/App.tsx

import AppRoutes from '@/Routes'
import { ConfigProvider, theme } from 'antd'

import dayjs from 'dayjs'
import moment from 'moment'

import localeProvider from 'antd/locale/pt_BR'
import 'moment/locale/pt-br'

dayjs.locale('pt-br')
moment.locale('pt-br')

moment.updateLocale('pt-br', {
  relativeTime: {
    future: 'em %s',
    past: '%s atrás',
    s: 'alguns segundos',
    ss: '%d segundos',
    m: '1 minuto',
    mm: '%d minutos',
    h: '1 hora',
    hh: '%d horas',
    d: '1 dia',
    dd: '%d dias',
    M: '1 mês',
    MM: '%d meses',
    y: '1 ano',
    yy: '%d anos'
  }
})

function App() {
  return <AppThemed />
}

export default App

const AppThemed = () => {
  const envVariables = {
    colorPrimary: import.meta.env.VITE_DASHBOARD_MAIN_COLOR || ''
  }

  return (
    <ConfigProvider
      locale={localeProvider}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: envVariables.colorPrimary
        }
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  )
}
