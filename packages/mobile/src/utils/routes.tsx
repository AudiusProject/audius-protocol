import { getHash, encodeUrlName } from '@audius/common'
import type { UserCollection, User } from '@audius/common/models'

import { env } from 'app/env'

type UserHandle = Pick<User, 'handle'>

const { AUDIUS_URL } = env

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
  const { permalink } = collection

  return fullUrl ? `${AUDIUS_URL}${permalink}` : permalink || ''
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
