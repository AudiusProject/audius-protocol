import { ID } from '@audius/common/models'
import { decodeHashId, route } from '@audius/common/utils'
import { matchPath } from 'react-router-dom'

const {
  PLAYLIST_ID_PAGE,
  PLAYLIST_BY_PERMALINK_PAGE,
  ALBUM_BY_PERMALINK_PAGE
} = route

type CollectionRouteParams =
  | {
      collectionId: ID
      handle: string
      collectionType: 'playlist' | 'album'
      title: string
      permalink?: string
    }
  | {
      collectionId: ID
      handle: null
      collectionType: null
      title: null
      permalink?: string
    }
  | {
      collectionId: null
      handle: null
      collectionType: string
      title: null
      permalink: string
    }
  | null

/**
 * Parses a collection route into handle, title, id, and type
 * If the route is a hash id route, title, handle, and type are not returned
 * @param route
 */
export const parseCollectionRoute = (route: string): CollectionRouteParams => {
  const playlistByPermalinkMatch = matchPath(PLAYLIST_BY_PERMALINK_PAGE, route)
  if (playlistByPermalinkMatch) {
    const { handle = '', slug = '' } = playlistByPermalinkMatch.params
    const permalink = `/${handle}/playlist/${slug}`
    return {
      collectionId: null,
      handle: null,
      collectionType: 'playlist',
      title: null,
      permalink
    }
  }

  const albumByPermalinkMatch = matchPath(ALBUM_BY_PERMALINK_PAGE, route)
  if (albumByPermalinkMatch) {
    const { handle = '', slug = '' } = albumByPermalinkMatch.params
    const permalink = `/${handle}/album/${slug}`
    return {
      collectionId: null,
      handle: null,
      collectionType: 'album',
      title: null,
      permalink
    }
  }

  const collectionIdPageMatch = matchPath(PLAYLIST_ID_PAGE, route)
  if (collectionIdPageMatch) {
    const collectionId = decodeHashId(collectionIdPageMatch.params.id ?? '')
    if (collectionId === null) return null
    return {
      collectionId,
      handle: null,
      collectionType: null,
      title: null
    }
  }

  return null
}
