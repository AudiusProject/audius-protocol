import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { ID } from '~/models/Identifiers'
import { trackPageActions } from '~/store/pages'

import { Config } from './types'
import { useTrack } from './useTrack'
import { useTrackByPermalink } from './useTrackByPermalink'

type TrackParams = { handle?: string; slug?: string; trackId?: ID }

/**
 * Hook that returns track data given either a track ID or a handle + slug.
 * Internally uses useTrack and useTrackByPermalink for consistent behavior.
 * @param params The track params - either {id} or {handle, slug}
 * @returns The track data or null if not found
 */
export const useTrackByParams = (params: TrackParams, options?: Config) => {
  const { handle, slug, trackId: id } = params
  const permalink = handle ? `/${handle}/${slug}` : null

  const dispatch = useDispatch()
  const trackQuery = useTrack(id, options)
  const permalinkQuery = useTrackByPermalink(permalink, options)

  const query = id ? trackQuery : permalinkQuery

  const { isSuccess } = query
  const trackIdResult = query.data?.track_id

  useEffect(() => {
    if (isSuccess && trackIdResult) {
      dispatch(trackPageActions.fetchTrackSucceeded(trackIdResult))
    }
  }, [isSuccess, trackIdResult, dispatch])

  return query
}
