import { ID } from '@audius/common/models'
import { decodeHashId, route } from '@audius/common/utils'
import { matchPath } from 'react-router-dom'

const { TRACK_ID_PAGE, TRACK_PAGE } = route

export type TrackRouteParams =
  | { slug: string; trackId: null; handle: string }
  | { slug: null; trackId: ID; handle: null }
  | null

export const parseTrackRoute = (route: string): TrackRouteParams => {
  const trackIdPageMatch = matchPath(TRACK_ID_PAGE, route)
  if (trackIdPageMatch) {
    const trackId = decodeHashId(trackIdPageMatch.params.id ?? '')
    if (trackId === null) return null
    return { slug: null, trackId, handle: null }
  }

  const trackPageMatch = matchPath(TRACK_PAGE, route)
  if (trackPageMatch) {
    const { handle = '', slug = '' } = trackPageMatch.params
    return { slug, trackId: null, handle }
  }

  return null
}
