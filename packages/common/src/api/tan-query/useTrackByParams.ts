import { useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { Kind } from '~/models'
import { ID } from '~/models/Identifiers'
import {
  trackPageActions,
  trackPageLineupActions,
  trackPageSelectors
} from '~/store/pages'
import { makeUid } from '~/utils/uid'

import { QueryOptions } from './types'
import { useTrack } from './useTrack'
import { useTrackByPermalink } from './useTrackByPermalink'

type TrackParams = { handle?: string; slug?: string; trackId?: ID | null }

/**
 * Hook that returns track data given either a track ID or a handle + slug.
 * Internally uses useTrack and useTrackByPermalink for consistent behavior.
 * @param params The track params - either {id} or {handle, slug}
 * @returns The track data or null if not found
 */
export const useTrackByParams = (
  params: TrackParams | null,
  options?: QueryOptions
) => {
  const { handle, slug, trackId: id } = params ?? {}
  const permalink = handle ? `/${handle}/${slug}` : null

  const dispatch = useDispatch()
  const trackQuery = useTrack(id, options)
  const permalinkQuery = useTrackByPermalink(permalink, options)
  const source = useSelector(trackPageSelectors.getSourceSelector)

  const query = id ? trackQuery : permalinkQuery

  const { data: track, isSuccess } = query

  useEffect(() => {
    if (track && isSuccess) {
      const { track_id, permalink } = track
      dispatch(trackPageActions.setTrackId(track_id))
      dispatch(trackPageActions.setTrackPermalink(permalink))

      // Add hero track to lineup early so that we can play it ASAP
      // instead of waiting for the entire lineup to load
      dispatch(
        trackPageLineupActions.tracksActions.add(
          {
            kind: Kind.TRACKS,
            id: track_id,
            uid: makeUid(Kind.TRACKS, track_id, source),
            ...track
          },
          track_id
        )
      )
    }
  }, [isSuccess, track, dispatch, source])

  return query
}
