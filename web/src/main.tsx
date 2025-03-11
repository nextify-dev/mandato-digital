// src/main.ts

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import GlobalStyle from './utils/styles/globals'

import { AuthProvider } from '@/contexts/AuthProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <GlobalStyle />
      <App />
    </AuthProvider>
  </React.StrictMode>
)
