import Config from 'react-native-config'
import Track, { TrackId } from '../models/Track'
import { UserCollection } from '../models/Collection'
import { UserHandle } from '../models/User'

/**
 * Formats a URL name for routing.
 *  Removes reserved URL characters
 *  Replaces white space with -
 *  Lower cases
 * @param name
 */
export const formatUrlName = (name: string) => {
  if (!name) {
    return ''
  }
  return (
    name
      .replace(/!|%|#|\$|&|'|\(|\)|&|\*|\+|,|\/|:|;|=|\?|@|\[|\]/g, '')
      .replace(/\s+/g, '-')
      // Reduce repeated `-` to a single `-`
      .replace(/-+/g, '-')
      .toLowerCase()
  )
}

/**
 * Encodes a formatted URL name for routing.
 * Using window.location will automatically decode
 * the encoded component, so using the above formatUrlName(string) can
 * be used to compare results with the window.location directly.
 * @param name
 */
export const encodeUrlName = (name: string) => {
  return encodeURIComponent(formatUrlName(name))
}

const AUDIUS_URL = Config.AUDIUS_URL

export const getTrackRoute = (track: TrackId, fullUrl = false) => {
  const route = `/${track.route_id}-${track.track_id}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getUserRoute = (user: UserHandle, fullUrl = false) => {
  const route = `/${user.handle}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getCollectionRoute = (
  collection: UserCollection,
  fullUrl = false
) => {
  const handle = collection.user.handle
  const title = collection.playlist_name
  const id = collection.playlist_id
  const route = collection.is_album
    ? `/${encodeUrlName(handle)}/album/${encodeUrlName(title)}-${id}`
    : `/${encodeUrlName(handle)}/playlist/${encodeUrlName(title)}-${id}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getSearchRoute = (
  query: string,
  fullUrl = false
) => {
  const route = `/search/${encodeUrlName(query)}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}
