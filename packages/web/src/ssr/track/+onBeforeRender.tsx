import { Maybe } from '@audius/common/utils'
import { full as FullSdk } from '@audius/sdk'
import type { PageContextServer } from 'vike/types'

import { audiusSdk } from 'ssr/util'

export type TrackPageProps = {
  track: Maybe<FullSdk.TrackFull>
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  try {
    const { data: tracks } = await audiusSdk.full.tracks.getBulkTracks({
      permalink: [`${handle}/${slug}`]
    })

    const pageProps = { track: tracks?.[0] }

    return {
      pageContext: {
        pageProps
      }
    }
  } catch (e) {
    console.error(
      'Error fetching track for track page SSR',
      'handle',
      handle,
      'slug',
      slug,
      'error',
      e
    )
    return {
      pageContext: {
        pageProps: {}
      }
    }
  }
}
