// src/main.ts

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from '@/App'
import GlobalStyle from '@/utils/styles/globals'

import { AuthProvider } from '@/contexts/AuthProvider'
import { UsersProvider } from '@/contexts/UsersProvider'
import { CitiesProvider } from '@/contexts/CitiesProvider'
import { VisitsProvider } from '@/contexts/VisitsProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CitiesProvider>
        <UsersProvider>
          <VisitsProvider>
            <GlobalStyle />
            <App />
          </VisitsProvider>
        </UsersProvider>
      </CitiesProvider>
    </AuthProvider>
  </React.StrictMode>
)
