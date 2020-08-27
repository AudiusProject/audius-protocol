import { matchPath } from 'react-router-dom'
import { TRACK_ID_PAGE, TRACK_PAGE } from 'utils/route'
import { decodeHashId } from './hashIds'
import { ID } from 'models/common/Identifiers'

type TrackRouteParams =
  | { trackTitle: string; trackId: ID; handle: string }
  | { trackTitle: null; trackId: ID; handle: null }
  | null

/**
 * Parses a track route into title, track id, and handle
 * If the route is a hash id route, track title and handle are not returned
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
    return { trackTitle: null, trackId, handle: null }
  }

  const trackPageMatch = matchPath<{ trackName: string; handle: string }>(
    route,
    {
      path: TRACK_PAGE,
      exact: true
    }
  )
  if (trackPageMatch) {
    const { handle, trackName } = trackPageMatch.params
    const nameParts = trackName.split('-')
    const trackTitle = nameParts.slice(0, nameParts.length - 1).join('-')
    const trackId = parseInt(nameParts[nameParts.length - 1], 10)
    if (!trackId || isNaN(trackId)) return null
    return { trackTitle, trackId, handle }
  }

  return null
}
