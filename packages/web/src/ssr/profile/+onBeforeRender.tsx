import { userMetadataFromSDK } from '@audius/common/adapters'
import { FullUserResponseFromJSON } from '@audius/sdk/src/sdk/api/generated/full/models/FullUserResponse'
import type { PageContextServer } from 'vike/types'

import { getDiscoveryNode } from '../getDiscoveryNode'

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle } = pageContext.routeParams

  try {
    // Fetching directly from discovery node rather than using the sdk because
    // including the sdk increases bundle size and creates substantial cold start times
    const discoveryNode = getDiscoveryNode()

    const discoveryRequestPath = `v1/full/users/handle/${handle}`
    const discoveryRequestUrl = `${discoveryNode.endpoint}/${discoveryRequestPath}`

    const res = await fetch(discoveryRequestUrl)
    if (res.status !== 200) {
      throw new Error(discoveryRequestUrl)
    }

    const { data } = FullUserResponseFromJSON(await res.json())
    if (!data || data.length === 0) {
      throw new Error(
        `Parsed SDK response returned no users for ${discoveryRequestUrl}`
      )
    }
    const apiUser = data[0]

    // Include api user images.
    const user = {
      ...userMetadataFromSDK(apiUser),
      cover_photo: apiUser.coverPhoto?._2000x,
      profile_picture: apiUser.profilePicture?._1000x1000
    }

    return {
      pageContext: {
        pageProps: { user }
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
