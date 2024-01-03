import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '@audius/sdk/src/sdk/config'
import { PageContextServer } from 'vike/types'

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

export type TrackPageProps = {
  track: any | undefined
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  try {
    const t = Date.now()

    // Fetching directly from discovery node rather than using the sdk
    // because including the sdk increases bundle size and creates substantial
    // cold start times
    const discoveryNodes = (
      sdkConfigs[process.env.VITE_ENVIRONMENT as keyof typeof sdkConfigs] ??
      productionConfig
    ).discoveryNodes

    const discoveryNode =
      discoveryNodes[Math.floor(Math.random() * discoveryNodes.length)]

    const discoveryRequestPath = `v1/full/tracks?handle=${handle}&slug=${slug}`
    const discoveryRequestUrl = `${discoveryNode}/${discoveryRequestPath}`

    const res = await fetch(discoveryRequestUrl)
    if (res.status !== 200) {
      throw new Error(discoveryRequestUrl)
    }

    const json = await res.json()

    console.log('profile sdk', Date.now() - t)

    return {
      pageContext: {
        pageProps: { track: json.data }
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
