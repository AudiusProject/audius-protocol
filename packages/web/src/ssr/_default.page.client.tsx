import { Track } from '@audius/sdk'
import { hydrateRoot } from 'react-dom/client'
import { PageContextClient } from 'vike/types'

import { WebPlayerSkeleton } from './WebPlayerSkeleton'

// TODO: test hydrate vs render
// TODO: can render skeleton on client and hydrate, then render full app
export async function render(
  pageContext: PageContextClient & { pageProps: { track: Track } }
) {
  const { Page, pageProps } = pageContext
  hydrateRoot(
    document.getElementById('page-view'),
    <WebPlayerSkeleton>
      <Page {...pageProps} />
    </WebPlayerSkeleton>
  )
}
