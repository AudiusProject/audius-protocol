import { ID } from '~/models/Identifiers'

import { useTrack } from './useTrack'
import { useTrackByPermalink } from './useTrackByPermalink'

type TrackParams = { id: ID } | { handle: string; slug: string }

/**
 * Hook that returns track data given either a track ID or a handle + slug.
 * Internally uses useTrack and useTrackByPermalink for consistent behavior.
 * @param params The track params - either {id} or {handle, slug}
 * @returns The track data or null if not found
 */
export const useTrackByParams = (params: TrackParams) => {
  const permalink =
    'handle' in params ? `/${params.handle}/${params.slug}` : null
  const id = 'id' in params ? params.id : null

  const trackQuery = useTrack(id, { enabled: !!id })
  const permalinkQuery = useTrackByPermalink(permalink, {
    enabled: !!permalink
  })

  return 'id' in params ? trackQuery : permalinkQuery
}
