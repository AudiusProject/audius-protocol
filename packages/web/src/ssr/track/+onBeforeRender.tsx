import {
  developmentConfig,
  productionConfig,
  stagingConfig
} from '@audius/sdk/src/sdk/config'
import type { PageContextServer } from 'vike/types'

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  try {
    // Fetching directly from discovery node rather than using the sdk because
    // including the sdk increases bundle size and creates substantial cold start times
    const discoveryNodes = (
      sdkConfigs[process.env.VITE_ENVIRONMENT as keyof typeof sdkConfigs] ??
      productionConfig
    ).discoveryNodes

    const discoveryNode =
      discoveryNodes[Math.floor(Math.random() * discoveryNodes.length)]

    const discoveryRequestPath = `v1/full/tracks?permalink=${handle}/${slug}`
    const discoveryRequestUrl = `${discoveryNode.endpoint}/${discoveryRequestPath}`

    const res = await fetch(discoveryRequestUrl)
    if (res.status !== 200) {
      throw new Error(discoveryRequestUrl)
    }

    const json = await res.json()

    return {
      pageContext: {
        pageProps: { track: json.data[0] }
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
