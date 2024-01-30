import { useCallback, useEffect, useMemo } from 'react'

import type { ChatMessageTileProps, ID } from '@audius/common'
import {
  Name,
  Kind,
  PlaybackSource,
  QueueSource,
  accountSelectors,
  getPathFromTrackUrl,
  makeUid,
  useGetTrackByPermalink
} from '@audius/common'
import { useGatedContentAccess, useToggleTrack } from '@audius/common/hooks'
import type { TrackPlayback } from '@audius/common/hooks'
import { useSelector } from 'react-redux'

import { TrackTile } from 'app/components/lineup-tile'
import { make, track as trackEvent } from 'app/services/analytics'

const { getUserId } = accountSelectors

export const ChatMessageTrack = ({
  link,
  onEmpty,
  onSuccess,
  styles
}: ChatMessageTileProps) => {
  const currentUserId = useSelector(getUserId)

  const permalink = getPathFromTrackUrl(link)
  const { data: track } = useGetTrackByPermalink(
    {
      permalink,
      currentUserId
    },
    { disabled: !permalink }
  )
  const { hasStreamAccess } = useGatedContentAccess(track ?? null)
  const isPreview =
    !!track?.is_stream_gated && !!track?.preview_cid && !hasStreamAccess

  const user = useMemo(() => (track ? { ...track.user } : null), [track])

  const trackId = track?.track_id
  const uid = useMemo(() => {
    return trackId ? makeUid(Kind.TRACKS, trackId) : null
  }, [trackId])

  const recordAnalytics = useCallback(
    ({ name, id }: { name: TrackPlayback; id: ID }) => {
      if (!track) return
      trackEvent(
        make({
          eventName: name,
          id: `${id}`,
          source: PlaybackSource.CHAT_TRACK
        })
      )
    },
    [track]
  )

  const { togglePlay } = useToggleTrack({
    id: track?.track_id,
    uid,
    isPreview,
    source: QueueSource.CHAT_TRACKS,
    recordAnalytics
  })

  useEffect(() => {
    if (track && user && uid) {
      trackEvent(
        make({
          eventName: Name.MESSAGE_UNFURL_TRACK
        })
      )
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [track, user, uid, onSuccess, onEmpty])

  return track && user && uid ? (
    <TrackTile
      index={0}
      togglePlay={togglePlay}
      uid={uid}
      isTrending={false}
      showArtistPick={false}
      showRankIcon={false}
      styles={styles}
      variant='readonly'
    />
  ) : null
}
