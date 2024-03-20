import { Buffer } from 'buffer'

import 'setimmediate'
import { full as FullSdk } from '@audius/sdk'
import processBrowser from 'process/browser'
import { hydrateRoot } from 'react-dom/client'
import type { PageContextClient } from 'vike/types'

import { isMobile as getIsMobile } from 'utils/clientUtil'

import '../index.css'

// @ts-ignore
window.global ||= window
// @ts-ignore
window.Buffer = Buffer
window.process = { ...processBrowser, env: process.env }

// Set this to false to turn off client hydration
// Useful for testing the SSR output
const HYDRATE_CLIENT = false

export default async function render(
  pageContext: PageContextClient & { pageProps: { track: FullSdk.TrackFull } }
) {
  const { pageProps } = pageContext

  const isMobile = getIsMobile()

  if (HYDRATE_CLIENT) {
    const { RootWithProviders } = await import('./RootWithProviders')
    hydrateRoot(
      document.getElementById('root') as HTMLElement,
      <RootWithProviders
        ssrContextValue={{
          isServerSide: false,
          isSsrEnabled: true,
          pageProps,
          isMobile,
          history: null
        }}
      />
    )
  }
}
