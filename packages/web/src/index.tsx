import 'setimmediate'

import { createRoot } from 'react-dom/client'

import './index.css'
import RootWithProviders from 'ssr/RootWithProviders'

// @ts-ignore
window.global ||= window

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <RootWithProviders
      ssrContextValue={{
        isServerSide: false,
        isSsrEnabled: false,
        isMobile: false
      }}
    />
  )
}
