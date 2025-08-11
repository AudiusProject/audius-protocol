import {
  userCollectionMetadataFromSDK,
  userMetadataFromSDK
} from '@audius/common/adapters'
import { FullPlaylistResponseFromJSON } from '@audius/sdk/src/sdk/api/generated/full/models/FullPlaylistResponse'
import type { PageContextServer } from 'vike/types'

import { getDiscoveryNode } from '../getDiscoveryNode'

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  // Fetching directly from discovery node rather than using the sdk because
  // including the sdk increases bundle size and creates substantial cold start times
  const discoveryNode = getDiscoveryNode()

  const discoveryRequestPath = `v1/full/playlists/by_permalink/${handle}/${slug}`
  const discoveryRequestUrl = `${discoveryNode}/${discoveryRequestPath}`

  const res = await fetch(discoveryRequestUrl)
  if (res.status !== 200) {
    throw new Error(discoveryRequestUrl)
  }

  const { data } = FullPlaylistResponseFromJSON(await res.json())
  if (!data || data.length === 0) {
    throw new Error(
      `Parsed SDK response returned no playlists for ${discoveryRequestUrl}`
    )
  }
  const [apiCollection] = data
  const collection = {
    ...userCollectionMetadataFromSDK(apiCollection),
    cover_art: apiCollection.artwork?._1000x1000
  }

  const { user: apiUser } = apiCollection
  const user = {
    ...userMetadataFromSDK(apiUser),
    cover_photo: apiUser.coverPhoto?._2000x,
    profile_picture: apiUser.profilePicture?._1000x1000
  }

  try {
    return {
      pageContext: {
        pageProps: {
          collection,
          user
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
