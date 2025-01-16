import { ID } from '@audius/common/models'
import { decodeHashId, route } from '@audius/common/utils'
import { matchPath } from 'react-router-dom'

const { TRACK_ID_PAGE, TRACK_PAGE } = route

export type TrackRouteParams =
  | { slug: string; handle: string; trackId: undefined }
  | { slug: undefined; trackId: ID; handle: undefined }
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
    return { slug: undefined, trackId, handle: undefined }
  }

  const trackPageMatch = matchPath<{ slug: string; handle: string }>(route, {
    path: TRACK_PAGE,
    exact: true
  })
  if (trackPageMatch) {
    const { handle, slug } = trackPageMatch.params
    return { slug, handle, trackId: undefined }
  }

  return null
}
