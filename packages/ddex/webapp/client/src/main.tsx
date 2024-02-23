import React from 'react'

import ReactDOM from 'react-dom/client'

import App from 'components/App'
import { EnvVarsProvider } from 'providers/EnvVarsProvider'

import '@audius/harmony/dist/harmony.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EnvVarsProvider>
      <App />
    </EnvVarsProvider>
  </React.StrictMode>
)
