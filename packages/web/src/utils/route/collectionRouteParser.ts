import { ID } from '@audius/common/models'
import { decodeHashId } from '@audius/common/utils'
import { matchPath } from 'react-router-dom'

import {
  PLAYLIST_PAGE,
  ALBUM_PAGE,
  PLAYLIST_ID_PAGE,
  PLAYLIST_BY_PERMALINK_PAGE,
  ALBUM_BY_PERMALINK_PAGE
} from 'utils/route'

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
  const playlistByPermalinkMatch = matchPath<{
    handle: string
    slug: string
  }>(route, {
    path: PLAYLIST_BY_PERMALINK_PAGE,
    exact: true
  })

  if (playlistByPermalinkMatch) {
    const { handle, slug } = playlistByPermalinkMatch.params
    const permalink = `/${handle}/playlist/${slug}`
    return {
      title: null,
      collectionId: null,
      permalink,
      handle: null,
      collectionType: 'playlist'
    }
  }
  const albumByPermalinkMatch = matchPath<{
    handle: string
    slug: string
  }>(route, {
    path: ALBUM_BY_PERMALINK_PAGE,
    exact: true
  })

  if (albumByPermalinkMatch) {
    const { handle, slug } = albumByPermalinkMatch.params
    const permalink = `/${handle}/album/${slug}`
    return {
      title: null,
      collectionId: null,
      permalink,
      handle: null,
      collectionType: 'album'
    }
  }

  const collectionIdPageMatch = matchPath<{ id: string }>(route, {
    path: PLAYLIST_ID_PAGE,
    exact: true
  })
  if (collectionIdPageMatch) {
    const collectionId = decodeHashId(collectionIdPageMatch.params.id)
    if (collectionId === null) return null
    return { collectionId, handle: null, collectionType: null, title: null }
  }

  const playlistPageMatch = matchPath<{
    handle: string
    playlistName: string
  }>(route, {
    path: PLAYLIST_PAGE,
    exact: true
  })
  if (playlistPageMatch) {
    const { handle, playlistName } = playlistPageMatch.params
    const nameParts = playlistName.split('-')
    const title = nameParts.slice(0, nameParts.length - 1).join('-')
    const collectionId = parseInt(nameParts[nameParts.length - 1], 10)
    if (!collectionId || isNaN(collectionId)) return null
    return { title, collectionId, handle, collectionType: 'playlist' }
  }

  const albumPageMatch = matchPath<{
    handle: string
    albumName: string
  }>(route, {
    path: ALBUM_PAGE,
    exact: true
  })
  if (albumPageMatch) {
    const { handle, albumName } = albumPageMatch.params
    const nameParts = albumName.split('-')
    const title = nameParts.slice(0, nameParts.length - 1).join('-')
    const collectionId = parseInt(nameParts[nameParts.length - 1], 10)
    if (!collectionId || isNaN(collectionId)) return null
    return { title, collectionId, handle, collectionType: 'album' }
  }

  return null
}
