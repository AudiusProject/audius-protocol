// By default, simply render the SPA without SSR

import 'setimmediate'
import { Buffer } from 'buffer'

import processBrowser from 'process/browser'
import { createRoot } from 'react-dom/client'
import { Root } from '../src/Root'

import '../src/index.css'

window.global ||= window
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }

export function render() {
  const container = document.getElementById('root')
  if (container) {
    const root = createRoot(container)
    root.render(<Root />)
  }
}
