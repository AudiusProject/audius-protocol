import { ID } from '@audius/common/models'
import { decodeHashId, route } from '@audius/common/utils'
import { matchPath } from 'react-router-dom'

const { USER_ID_PAGE, PROFILE_PAGE, PROFILE_PAGE_TRACKS } = route

export type UserRouteParams =
  | { handle: string; userId: null }
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

  const profilePageTabMatch = matchPath(PROFILE_PAGE_TRACKS, route)
  if (profilePageTabMatch) {
    const { handle = '' } = profilePageTabMatch.params
    return { handle, userId: null }
  }

  return null
}
