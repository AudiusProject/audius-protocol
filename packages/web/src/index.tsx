import 'setimmediate'

import { createRoot } from 'react-dom/client'

import './index.css'
import RootWithProviders from 'ssr/RootWithProviders'
import { registerErrorHmrHandler } from 'utils/hmr/errorHmrHandler'

// @ts-ignore
window.global ||= window

// Enable wallet API mocks for development/testing
if (process.env.NODE_ENV !== 'production') {
  import('./test/mocks/browser')
}

// Register HMR handler to close the error page when HMR updates fix errors
registerErrorHmrHandler()

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<RootWithProviders isServerSide={false} isMobile={false} />)
}
