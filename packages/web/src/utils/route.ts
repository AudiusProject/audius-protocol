import { SearchCategory, SearchFilters } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { convertGenreLabelToValue, route } from '@audius/common/utils'
import { Genre } from '@audius/sdk'
import { Location } from 'history'
import { stringifyUrl } from 'query-string'
import { matchPath } from 'react-router'
import { push } from 'redux-first-history'

import { env } from 'services/env'

import { encodeUrlName } from './urlUtils'

const { getHash, SIGN_UP_PAGE, SEARCH_PAGE, profilePage, collectionPage } =
  route

const USE_HASH_ROUTING = env.USE_HASH_ROUTING

// Host/protocol.
export const BASE_URL = `${env.PUBLIC_PROTOCOL}//${env.PUBLIC_HOSTNAME}`
export const BASE_GA_URL = `${env.PUBLIC_PROTOCOL}//${env.PUBLIC_HOSTNAME}`
export const BASENAME = env.BASENAME

// Create full formed urls for routes.
export const fullTrackPage = (permalink: string) => {
  return `${BASE_URL}${permalink}`
}

export const trackRemixesPage = (permalink: string) => {
  return `${permalink}/remixes`
}
export const fullTrackRemixesPage = (permalink: string) => {
  return `${fullTrackPage(permalink)}/remixes`
}

export const fullAiPage = (handle: string) => {
  return `${fullProfilePage(handle)}/ai`
}

export const albumPage = (handle: string, title: string, id: ID) => {
  return `/${encodeUrlName(handle)}/album/${encodeUrlName(title)}-${id}`
}
export const fullAlbumPage = (handle: string, title: string, id: ID) => {
  return `${BASE_URL}${albumPage(handle, title, id)}`
}

export const fullCollectionPage = (
  handle: string,
  playlistName?: string | null,
  playlistId?: ID | null,
  permalink?: string | null,
  isAlbum?: boolean
) => {
  return `${BASE_URL}${collectionPage(
    handle,
    playlistName,
    playlistId,
    permalink,
    isAlbum
  )}`
}

export const audioNftPlaylistPage = (handle: string) => {
  return `/${encodeUrlName(handle)}/audio-nft-playlist`
}
export const fullAudioNftPlaylistPage = (handle: string) => {
  return `${BASE_URL}${audioNftPlaylistPage(handle)}`
}

export const collectibleDetailsPage = (
  handle: string,
  collectibleId: string
) => {
  return `/${encodeUrlName(handle)}/collectibles/${getHash(collectibleId)}`
}
export const fullCollectibleDetailsPage = (
  handle: string,
  collectibleId: string
) => {
  return `${BASE_URL}${collectibleDetailsPage(handle, collectibleId)}`
}

export const fullProfilePage = (handle: string) => {
  return `${BASE_URL}${profilePage(handle)}`
}
export const profilePageAiAttributedTracks = (handle: string) => {
  return `${profilePage(handle)}/ai`
}

export const searchResultsPage = (query: string) => {
  return `/search/${query}`
}

export const fullSearchResultsPage = (query: string) => {
  return `${BASE_URL}${searchResultsPage(query)}`
}

export const searchResultsPageV2 = (
  category: SearchCategory,
  query: string
) => {
  if (category === 'all') {
    return `/search?query=${query}`
  }
  return `/search/${category}/?query=${query}`
}

export const fullSearchResultsPageV2 = (
  category: SearchCategory,
  query: string
) => {
  return `${BASE_URL}${searchResultsPageV2(category, query)}`
}

export const exploreMoodPlaylistsPage = (mood: string) => {
  return `/explore/${mood}`
}

export const chatPage = (id: string) => {
  return `/messages/${id}`
}

export const doesMatchRoute = (
  location: Location,
  route: string,
  exact = true
) => {
  return matchPath(getPathname(location), {
    path: route,
    exact
  })
}

export const stripBaseUrl = (url: string) => url.replace(BASE_URL, '')

/**
 * Gets the pathname from the location or the hashed path name
 * if using hash routing
 * @param {Location} location
 */
export const getPathname = (location: Location) => {
  return BASENAME ? location.pathname.replace(BASENAME, '') : location.pathname
}

export const recordGoToSignup = (callback: () => void) => {
  if ((window as any).analytics) {
    ;(window as any).analytics.track(
      'Create Account: Open',
      { source: 'landing page' },
      null,
      callback
    )
  } else {
    callback()
  }
}

/**
 * Forces a reload of the window by manually setting the location.href
 */
export const pushWindowRoute = (route: string) => {
  let routeToPush: string
  if (USE_HASH_ROUTING) {
    routeToPush = `/#${route}`
  } else {
    routeToPush = route
  }

  if (route === SIGN_UP_PAGE) {
    recordGoToSignup(() => {
      window.location.href = `${BASENAME}${routeToPush}`
    })
  } else {
    window.location.href = `${BASENAME}${routeToPush}`
  }
}

/**
 * Only calls push route if unique (not current route)
 */
export const pushUniqueRoute = (location: Location, route: string) => {
  const pathname = getPathname(location)
  if (route !== pathname) {
    return push(route)
  }
  return { type: '' }
}

type SearchOptions = {
  category?: 'all' | 'tracks' | 'profiles' | 'albums' | 'playlists'
  query?: string
} & SearchFilters

export const createSearchPageUrl = (searchOptions: SearchOptions) => {
  const { category, ...searchParams } = searchOptions

  if (searchParams.genre) {
    searchParams.genre = convertGenreLabelToValue(searchParams.genre) as Genre
  }

  return stringifyUrl({
    url: `${SEARCH_PAGE}/${category}`,
    query: searchParams
  })
}
