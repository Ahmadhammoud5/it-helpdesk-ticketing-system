import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { AuthProvider } from './auth/AuthContext'
import ToastProvider from './components/toast/ToastProvider'
import router from './router/AppRouter'
import ThemeProvider from './theme/ThemeContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
