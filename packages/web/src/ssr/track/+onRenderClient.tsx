import { full as FullSdk } from '@audius/sdk'
import { hydrateRoot } from 'react-dom/client'
import { PageContextClient } from 'vike/types'

import { Root } from '../../Root'
import { SsrContextProvider } from '../SsrContext'

import '../../index.css'

import { Buffer } from 'buffer'

import processBrowser from 'process/browser'

window.global ||= window
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }

// Set this to false to turn off client hydration
// Useful for testing the SSR output
const HYDRATE_CLIENT = true

export default async function render(
  pageContext: PageContextClient & { pageProps: { track: FullSdk.TrackFull } }
) {
  const { pageProps, urlPathname } = pageContext

  if (HYDRATE_CLIENT) {
    hydrateRoot(
      document.getElementById('root'),
      <SsrContextProvider
        value={{ path: urlPathname, isServerSide: false, pageProps }}
      >
        <Root />
      </SsrContextProvider>
    )
  }
}
