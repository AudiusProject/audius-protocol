import type { Maybe } from '@audius/common'
import { Track, sdk } from '@audius/sdk'
import { PageContextServer } from 'vike/types'

const audiusSdk = sdk({
  appName: 'audius.co'
})

export type TrackPageProps = {
  track: Maybe<Track>
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  const { data: tracks } = await audiusSdk.full.tracks.getBulkTracks({
    permalink: [`${handle}/${slug}`]
  })

  const pageProps = { track: tracks?.[0] }

  return {
    pageContext: {
      pageProps
    }
  }
}
