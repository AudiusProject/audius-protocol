import { QueryClientProvider } from '@tanstack/react-query'
import 'regenerator-runtime'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { queryClient } from './query'
import { Router } from './Router'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <Router />
  </QueryClientProvider>
)
