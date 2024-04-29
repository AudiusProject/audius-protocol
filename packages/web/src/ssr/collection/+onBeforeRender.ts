import { Maybe } from '@audius/common/utils'
import type { full as FullSdk } from '@audius/sdk'
import type { PageContextServer } from 'vike/types'

import { audiusSdk } from '../sdk'

export type CollectionPageProps = {
  collection: Maybe<FullSdk.PlaylistFull>
}

export async function onBeforeRender(pageContext: PageContextServer) {
  const { handle, slug } = pageContext.routeParams

  try {
    // NOTE: This is the playlist api, but works for both albums and playlists
    const { data: collections } =
      await audiusSdk.full.playlists.getPlaylistByHandleAndSlug({
        handle,
        slug
      })
    const collection = collections?.[0]

    return {
      pageContext: {
        pageProps: {
          collection
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
