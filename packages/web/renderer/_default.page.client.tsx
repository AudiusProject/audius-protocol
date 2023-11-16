// By default, simply render the SPA without SSR

import 'setimmediate'
import { Buffer } from 'buffer'

import processBrowser from 'process/browser'
import { createRoot } from 'react-dom/client'

import '../src/index.css'

window.global ||= window
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }

export async function render() {
  const container = document.getElementById('root')
  const Root = await import('../src/root')
  if (container) {
    const root = createRoot(container)
    root.render(<Root />)
  }
}
