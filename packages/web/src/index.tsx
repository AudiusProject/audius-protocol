import 'setimmediate'

import { createRoot } from 'react-dom/client'

import './index.css'
import { Root } from './Root'

// @ts-ignore
window.global ||= window

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Root />)
}
