import type { UserCollection, User } from '@audius/common'
import { getHash, encodeUrlName } from '@audius/common'
import Config from 'react-native-config'

type UserHandle = Pick<User, 'handle'>

const { AUDIUS_URL } = Config

export const getTrackRoute = (
  track: { permalink: string },
  fullUrl = false
) => {
  const route = track.permalink
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getUserRoute = (user: UserHandle, fullUrl = false) => {
  const route = `/${encodeUrlName(user.handle)}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getCollectionRoute = (
  collection: UserCollection,
  fullUrl = false
) => {
  const { playlist_name, playlist_id, is_album, user } = collection
  const { handle } = user
  const encodedHandle = encodeUrlName(handle)
  const encodedPlaylistName = encodeUrlName(playlist_name)
  const collectionType = is_album ? 'album' : 'playlist'
  const route = `/${encodedHandle}/${collectionType}/${encodedPlaylistName}-${playlist_id}`

  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getSearchRoute = (query: string, fullUrl = false) => {
  const route = `/search/${encodeUrlName(query)}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getTagSearchRoute = (query: string, fullUrl = false) => {
  const route = `/search/#${encodeUrlName(query)}`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getEmptyPageRoute = (fullUrl = false) => {
  const route = `/empty_page`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getAudioPageRoute = () => {
  return '/audio'
}

export const getCollectiblesRoute = (
  handle: string,
  collectibleId?: string,
  fullUrl?: boolean
) =>
  `${fullUrl ? AUDIUS_URL : ''}/${encodeUrlName(handle)}/collectibles${
    collectibleId ? `/${getHash(collectibleId)}` : ''
  }`
