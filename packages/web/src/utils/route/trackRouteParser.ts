import { decodeHashId } from '@audius/common'
import { ID } from '@audius/common/models'
import { matchPath } from 'react-router-dom'

import { TRACK_ID_PAGE, TRACK_PAGE } from 'utils/route'

export type TrackRouteParams =
  | { slug: string; trackId: null; handle: string }
  | { slug: null; trackId: ID; handle: null }
  | null

/**
 * Parses a track route into slug, track id, and handle
 * If the route is a hash id route, track title and handle are not returned, and vice versa
 * @param route
 */
export const parseTrackRoute = (route: string): TrackRouteParams => {
  const trackIdPageMatch = matchPath<{ id: string }>(route, {
    path: TRACK_ID_PAGE,
    exact: true
  })
  if (trackIdPageMatch) {
    const trackId = decodeHashId(trackIdPageMatch.params.id)
    if (trackId === null) return null
    return { slug: null, trackId, handle: null }
  }

  const trackPageMatch = matchPath<{ slug: string; handle: string }>(route, {
    path: TRACK_PAGE,
    exact: true
  })
  if (trackPageMatch) {
    const { handle, slug } = trackPageMatch.params
    return { slug, trackId: null, handle }
  }

  return null
}
