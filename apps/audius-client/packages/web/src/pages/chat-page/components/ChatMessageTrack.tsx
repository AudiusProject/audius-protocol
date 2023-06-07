import { useCallback, useEffect, useMemo } from 'react'

import {
  Kind,
  Status,
  makeUid,
  PlaybackSource,
  QueueSource,
  accountSelectors,
  useGetTrackByPermalink,
  getPathFromTrackUrl,
  useToggleTrack,
  ID,
  TrackPlayback,
  ChatMessageTileProps
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import MobileTrackTile from 'components/track/mobile/ConnectedTrackTile'

const { getUserId } = accountSelectors

export const ChatMessageTrack = ({
  link,
  onEmpty,
  onSuccess,
  className
}: ChatMessageTileProps) => {
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)
  const permalink = getPathFromTrackUrl(link)

  const { data: track, status } = useGetTrackByPermalink(
    {
      permalink: permalink!,
      currentUserId: currentUserId!
    },
    { disabled: !permalink || !currentUserId }
  )

  const trackId = track?.track_id
  const uid = useMemo(() => {
    return trackId ? makeUid(Kind.TRACKS, trackId) : null
  }, [trackId])

  const recordAnalytics = useCallback(
    ({ name, id }: { name: TrackPlayback; id: ID }) => {
      if (!track) return
      dispatch(
        make(name, {
          id: `${id}`,
          source: PlaybackSource.CHAT_TRACK
        })
      )
    },
    [dispatch, track]
  )

  const { togglePlay, isTrackPlaying } = useToggleTrack({
    id: track?.track_id,
    uid,
    source: QueueSource.CHAT_TRACKS,
    recordAnalytics
  })

  useEffect(() => {
    if (track && uid) {
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [track, uid, onSuccess, onEmpty])

  return track && uid ? (
    <div className={className}>
      {/* You may wonder why we use the mobile web track tile here.
      It's simply because the chat track tile uses the same design as mobile web. */}
      <MobileTrackTile
        index={0}
        togglePlay={togglePlay}
        uid={uid}
        isLoading={status === Status.LOADING || status === Status.IDLE}
        hasLoaded={() => {}}
        isTrending={false}
        showRankIcon={false}
        showArtistPick={false}
        isActive={isTrackPlaying}
        variant='readonly'
      />
    </div>
  ) : null
}
