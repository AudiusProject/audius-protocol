// For all routes except the explicitly defined ones (Track)
// simply render the SPA without SSR
// TODO: Use vike SPA setting

import 'setimmediate'
import { Buffer } from 'buffer'

import processBrowser from 'process/browser'
import { createRoot } from 'react-dom/client'

import { Root } from '../../Root'

import '../../index.css'

// @ts-ignore
window.global ||= window
// @ts-ignore
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }

export function render() {
  const container = document.getElementById('root')
  if (container) {
    const root = createRoot(container)
    root.render(<Root />)
  }
}
