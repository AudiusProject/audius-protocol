import React from 'react'
import ReactDOM from 'react-dom/client'
import { EnvVarsProvider } from './providers/EnvVarsProvider'
import AppWithProviders from './components/AppWithProviders'

import '@audius/harmony/dist/harmony.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EnvVarsProvider>
      <AppWithProviders />
    </EnvVarsProvider>
  </React.StrictMode>
)
