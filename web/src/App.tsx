// src/App.tsx

import AppRoutes from '@/Routes'
import { ConfigProvider, theme } from 'antd'

import dayjs from 'dayjs'
import moment from 'moment'

import localeProvider from 'antd/locale/pt_BR'
import 'moment/locale/pt-br'

dayjs.locale('pt-br')
moment.locale('pt-br')

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
