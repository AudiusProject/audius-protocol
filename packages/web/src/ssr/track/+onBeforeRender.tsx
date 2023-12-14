import type { Maybe } from '@audius/common'
import {
  sdk,
  full as FullSdk,
  DiscoveryNodeSelector,
  productionConfig,
  stagingConfig,
  developmentConfig
} from '@audius/sdk'
import { PageContextServer } from 'vike/types'

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

const discoveryNodeSelector = new DiscoveryNodeSelector({
  bootstrapServices: (
    sdkConfigs[process.env.VITE_ENVIRONMENT as keyof typeof sdkConfigs] ??
    productionConfig
  ).discoveryNodes
})

const audiusSdk = sdk({
  appName: process.env.VITE_PUBLIC_HOSTNAME ?? 'audius.co',
  services: {
    discoveryNodeSelector
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
