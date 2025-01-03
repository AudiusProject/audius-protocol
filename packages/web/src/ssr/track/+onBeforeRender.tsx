import {
  makeTrack,
  makeUser
} from '@audius/common/src/services/audius-api-client/ResponseAdapter'
import type { PageContextServer } from 'vike/types'

import { getDiscoveryNode } from '../getDiscoveryNode'

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  try {
    // Fetching directly from discovery node rather than using the sdk because
    // including the sdk increases bundle size and creates substantial cold start times
    const discoveryNode = getDiscoveryNode()

    const discoveryRequestPath = `v1/full/tracks?permalink=${handle}/${slug}`
    const discoveryRequestUrl = `${discoveryNode.endpoint}/${discoveryRequestPath}`

    const res = await fetch(discoveryRequestUrl)
    if (res.status !== 200) {
      throw new Error(discoveryRequestUrl)
    }

    const { data } = await res.json()
    const [apiTrack] = data
    // Include artwork in the track object
    const track = {
      ...makeTrack(apiTrack),
      cover_art: apiTrack.artwork?.['1000x1000']
    }

    const { user: apiUser } = apiTrack
    // Include api user images.
    const user = {
      ...makeUser(apiUser),
      cover_photo: apiUser.cover_photo?.['2000x'],
      profile_picture: apiUser.profile_picture?.['1000x1000']
    }

    return {
      pageContext: {
        pageProps: { track, user }
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
