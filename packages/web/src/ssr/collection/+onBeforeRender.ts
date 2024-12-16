import {
  userCollectionMetadataFromSDK,
  userMetadataFromSDK,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import type { full } from '@audius/sdk'
import { developmentConfig } from '@audius/sdk/src/sdk/config/development'
import { productionConfig } from '@audius/sdk/src/sdk/config/production'
import { stagingConfig } from '@audius/sdk/src/sdk/config/staging'
import type { PageContextServer } from 'vike/types'

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

export type CollectionPageProps = {}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  // Fetching directly from discovery node rather than using the sdk because
  // including the sdk increases bundle size and creates substantial cold start times
  const discoveryNodes = (
    sdkConfigs[process.env.VITE_ENVIRONMENT as keyof typeof sdkConfigs] ??
    productionConfig
  ).network.discoveryNodes

  const discoveryNode =
    discoveryNodes[Math.floor(Math.random() * discoveryNodes.length)]

  const discoveryRequestPath = `v1/full/playlists/by_permalink/${handle}/${slug}`
  const discoveryRequestUrl = `${discoveryNode.endpoint}/${discoveryRequestPath}`

  const res = await fetch(discoveryRequestUrl)
  if (res.status !== 200) {
    throw new Error(discoveryRequestUrl)
  }

  const { data } = await res.json()
  const [apiCollection] = data
  const collection = {
    ...userCollectionMetadataFromSDK(apiCollection),
    cover_art: apiCollection.artwork?._1000x1000
  }

  const { user: apiUser } = apiCollection
  const user = {
    ...userMetadataFromSDK(apiUser),
    cover_photo: apiUser.cover_photo?._2000x,
    profile_picture: apiUser.profile_picture?._1000x1000
  }

  const tracks = apiCollection.tracks.map((apiTrack: full.TrackFull) => ({
    ...userTrackMetadataFromSDK(apiTrack),
    cover_art: apiTrack.artwork?._150x150
  }))

  try {
    return {
      pageContext: {
        pageProps: {
          collection,
          user,
          tracks
        }
      }
    }
  } catch (e) {
    console.error(
      'Error fetching collection for collection page SSR',
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
