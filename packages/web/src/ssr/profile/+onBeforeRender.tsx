import { makeUser } from '@audius/common/src/services/audius-api-client/ResponseAdapter'
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

    const { data } = await res.json()
    const apiUser = data[0]

    // Include api user images.
    const user = {
      ...makeUser(apiUser),
      cover_photo: apiUser.cover_photo?.['2000x'],
      profile_picture: apiUser.profile_picture?.['1000x1000']
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
