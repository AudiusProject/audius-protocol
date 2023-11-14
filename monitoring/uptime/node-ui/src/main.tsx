import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AudiusLibsProvider } from './providers/AudiusLibsProvider.tsx'
import { EnvVarsProvider } from './providers/EnvVarsProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EnvVarsProvider>
      <AudiusLibsProvider>
        <App />
      </AudiusLibsProvider>
    </EnvVarsProvider>
  </React.StrictMode>
)
