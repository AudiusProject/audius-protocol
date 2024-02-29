// For all routes except the explicitly defined ones (Track)
// simply render the SPA without SSR
// TODO: Use vike SPA setting

import 'setimmediate'
import { Buffer } from 'buffer'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import processBrowser from 'process/browser'
import { createRoot } from 'react-dom/client'

import '../../index.css'
import { SsrContextProvider } from 'ssr/SsrContext'

import { Root } from '../../Root'

const cache = createCache({ key: 'harmony', prepend: true })

// @ts-ignore
window.global ||= window
// @ts-ignore
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }

export function render() {
  const container = document.getElementById('root')
  if (container) {
    const root = createRoot(container)
    root.render(
      <CacheProvider value={cache}>
        <SsrContextProvider
          value={{
            isServerSide: false,
            isSsrEnabled: false,
            pageProps: {},
            isMobile: false,
            history: null
          }}
        >
          <Root />
        </SsrContextProvider>
      </CacheProvider>
    )
  }
}
