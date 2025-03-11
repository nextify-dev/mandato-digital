// src/App.tsx

import AppRoutes from '@/Routes'
import { ConfigProvider, App as AntdApp, theme } from 'antd'

import dayjs from 'dayjs'
dayjs.locale('pt-br')
import localeProvider from 'antd/locale/pt_BR'

function App() {
  return <AppThemed />
}

export default App

const AppThemed = () => {
  return (
    <ConfigProvider
      locale={localeProvider}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: import.meta.env.VITE_DASHBOARD_MAIN_COLOR
        }
      }}
    >
      <AntdApp>
        <AppRoutes />
      </AntdApp>
    </ConfigProvider>
  )
}
