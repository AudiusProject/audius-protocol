import { QueryClientProvider } from '@tanstack/react-query'
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

function timeDiffInMinutes(start: Date | undefined, end: Date | undefined) {
  if (start && end && end.getTime() > start.getTime()) {
    const diff = (end.getTime() - start.getTime()) / 1000 / 60
    return `${diff.toFixed(0)}m`
  }
  return ''
}
