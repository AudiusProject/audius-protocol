import { useRouteMatch } from 'hooks/useRouteMatch'
import { TRACK_REMIXES_PAGE } from 'utils/route'

export const useTrackIdFromUrl = () => {
  const params = useRouteMatch<{
    handle: string
    trackName: string
  }>(TRACK_REMIXES_PAGE)
  if (params) {
    const nameParts = params.trackName.split('-')
    const trackId = parseInt(nameParts[nameParts.length - 1], 10)
    return trackId
  }
  return null
}
