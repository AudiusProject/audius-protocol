import 'setimmediate'

import { createRoot } from 'react-dom/client'

import './index.css'
import { HarmonyCacheProvider } from 'HarmonyCacheProvider'
import { SsrContextProvider } from 'ssr/SsrContext'

import { Root } from './Root'

// @ts-ignore
window.global ||= window

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <HarmonyCacheProvider>
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
    </HarmonyCacheProvider>
  )
}
