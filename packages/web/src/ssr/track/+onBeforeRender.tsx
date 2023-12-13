import type { Maybe } from '@audius/common'
import { sdk, full as FullSdk, Logger } from '@audius/sdk'
import { PageContextServer } from 'vike/types'

const logger = new Logger({ logLevel: 'debug' })

// TODO: Configure for different envs
const audiusSdk = sdk({
  appName: 'audius.co',
  services: {
    logger
  }
})

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
    console.error('sdk error', handle, slug, e)
    return {
      pageContext: {
        pageProps: {}
      }
    }
  }
}
