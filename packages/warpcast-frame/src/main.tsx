import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'
import App from './App.tsx'
import '@audius/harmony/dist/harmony.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HarmonyThemeProvider theme='day'>
      <App />
    </HarmonyThemeProvider>
  </React.StrictMode>
)
