import { ID } from '@audius/common/models'
import { ProfilePageTabRoute } from '@audius/common/store'
import { decodeHashId, route } from '@audius/common/utils'
import { matchPath } from 'react-router-dom'

const {
  USER_ID_PAGE,
  PROFILE_PAGE,
  PROFILE_PAGE_TRACKS,
  PROFILE_PAGE_ALBUMS,
  PROFILE_PAGE_PLAYLISTS,
  PROFILE_PAGE_REPOSTS,
  PROFILE_PAGE_COLLECTIBLES
} = route

export type UserRouteParams =
  | { handle: string; userId: null; tab: ProfilePageTabRoute }
  | { handle: null; userId: ID }
  | null

export const parseUserRoute = (route: string): UserRouteParams => {
  const userIdPageMatch = matchPath(USER_ID_PAGE, route)
  if (userIdPageMatch) {
    const userId = decodeHashId(userIdPageMatch.params.id ?? '')
    if (userId === null) return null
    return { handle: null, userId }
  }

  const profilePageMatch = matchPath(PROFILE_PAGE, route)
  if (profilePageMatch) {
    const { handle = '' } = profilePageMatch.params
    return { handle, userId: null }
  }

  const profilePageTracksMatch = matchPath(PROFILE_PAGE_TRACKS, route)
  if (profilePageTracksMatch) {
    const { handle = '' } = profilePageTracksMatch.params
    return { handle, userId: null, tab: ProfilePageTabRoute.TRACKS }
  }

  const profilePageAlbumsMatch = matchPath(PROFILE_PAGE_ALBUMS, route)
  if (profilePageAlbumsMatch) {
    const { handle = '' } = profilePageAlbumsMatch.params
    return { handle, userId: null, tab: ProfilePageTabRoute.ALBUMS }
  }

  const profilePagePlaylistsMatch = matchPath(PROFILE_PAGE_PLAYLISTS, route)
  if (profilePagePlaylistsMatch) {
    const { handle = '' } = profilePagePlaylistsMatch.params
    return { handle, userId: null, tab: ProfilePageTabRoute.PLAYLISTS }
  }

  const profilePageRepostsMatch = matchPath(PROFILE_PAGE_REPOSTS, route)
  if (profilePageRepostsMatch) {
    const { handle = '' } = profilePageRepostsMatch.params
    return { handle, userId: null, tab: ProfilePageTabRoute.REPOSTS }
  }

  const profilePageCollectiblesMatch = matchPath(
    PROFILE_PAGE_COLLECTIBLES,
    route
  )
  if (profilePageCollectiblesMatch) {
    const { handle = '' } = profilePageCollectiblesMatch.params
    return { handle, userId: null, tab: ProfilePageTabRoute.COLLECTIBLES }
  }

  return null
}
