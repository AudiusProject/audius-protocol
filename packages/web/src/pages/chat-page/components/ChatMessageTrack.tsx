import { useCallback, useEffect, useMemo } from 'react'

import { useTrackByPermalink } from '@audius/common/api'
import {
  TrackPlayback,
  useGatedContentAccess,
  useToggleTrack
} from '@audius/common/hooks'
import {
  Name,
  PlaybackSource,
  Kind,
  Status,
  ID,
  ModalSource
} from '@audius/common/models'
import { QueueSource, ChatMessageTileProps } from '@audius/common/store'
import { getPathFromTrackUrl, makeUid } from '@audius/common/utils'
import { pick } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { TrackTile } from 'components/track/mobile/TrackTile'
import { TrackTileSize } from 'components/track/types'

export const ChatMessageTrack = ({
  link,
  onEmpty,
  onSuccess,
  className
}: ChatMessageTileProps) => {
  const dispatch = useDispatch()
  const permalink = getPathFromTrackUrl(link)

  const { data: partialTrack } = useTrackByPermalink(permalink, {
    select: (track) =>
      pick(track, [
        'track_id',
        'is_delete',
        'is_stream_gated',
        'preview_cid',
        'access',
        'stream_conditions',
        'is_download_gated',
        'download_conditions'
      ])
  })
  const trackExists = !!partialTrack

  const { hasStreamAccess } = useGatedContentAccess(partialTrack)
  const { track_id, is_delete, is_stream_gated, preview_cid } =
    partialTrack ?? {}
  const isPreview = !!is_stream_gated && !!preview_cid && !hasStreamAccess

  const uid = useMemo(() => {
    return track_id ? makeUid(Kind.TRACKS, track_id) : null
  }, [track_id])

  const recordAnalytics = useCallback(
    ({ name, id }: { name: TrackPlayback; id: ID }) => {
      if (!trackExists) return
      dispatch(
        make(name, {
          id: `${id}`,
          source: PlaybackSource.CHAT_TRACK
        })
      )
    },
    [dispatch, trackExists]
  )

  const { togglePlay, isTrackPlaying } = useToggleTrack({
    id: track_id,
    uid,
    isPreview,
    source: QueueSource.CHAT_TRACKS,
    recordAnalytics
  })

  useEffect(() => {
    if (trackExists && uid && !is_delete) {
      dispatch(make(Name.MESSAGE_UNFURL_TRACK, {}))
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [trackExists, uid, onSuccess, onEmpty, dispatch, is_delete])

  return trackExists && uid && track_id ? (
    // You may wonder why we use the mobile web track tile here.
    // It's simply because the chat track tile uses the same design as mobile web.
    <TrackTile
      containerClassName={className}
      index={0}
      uid={uid}
      id={track_id}
      size={TrackTileSize.SMALL}
      ordered={false}
      trackTileStyles={{}}
      togglePlay={togglePlay}
      hasLoaded={() => {}}
      isLoading={status === Status.LOADING || status === Status.IDLE}
      isTrending={false}
      isActive={isTrackPlaying}
      variant='readonly'
      source={ModalSource.DirectMessageTrackTile}
    />
  ) : null
}
