import { Maybe } from '@audius/common/utils'
import {
  sdk,
  full as FullSdk,
  DiscoveryNodeSelector,
  productionConfig,
  stagingConfig,
  developmentConfig
} from '@audius/sdk'
import type { PageContextServer } from 'vike/types'

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

export type ProfilePageProps = {
  user: Maybe<FullSdk.UserFull>
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle } = pageContext.routeParams

  try {
    const { data: users } = await audiusSdk.full.users.getUserByHandle({
      handle
    })
    const user = users?.[0]

    const pageProps = { user }

    return {
      pageContext: {
        pageProps
      }
    }
  } catch (e) {
    console.error(
      'Error fetching user for profile page SSR',
      'handle',
      handle,
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
