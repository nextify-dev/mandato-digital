// src/App.tsx

import AppRoutes from '@/Routes'
import { ConfigProvider, theme } from 'antd'

import dayjs from 'dayjs'
dayjs.locale('pt-br')
import localeProvider from 'antd/locale/pt_BR'

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
