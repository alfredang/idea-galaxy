import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'sonner'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 10, 10, 0.9)',
              border: '1px solid rgba(255, 107, 0, 0.3)',
              color: '#EDEDED',
              backdropFilter: 'blur(12px)'
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
