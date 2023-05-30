import { useCallback, useMemo } from 'react'

import {
  Kind,
  Status,
  makeUid,
  queueSelectors,
  playerSelectors,
  Name,
  PlaybackSource,
  queueActions,
  QueueSource,
  accountSelectors,
  useGetTrackByPermalink,
  getPathFromTrackUrl
} from '@audius/common'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import MobileTrackTile from 'components/track/mobile/ConnectedTrackTile'

import styles from './ChatMessageTrack.module.css'

const { getUserId } = accountSelectors
const { makeGetCurrent } = queueSelectors
const { getPlaying } = playerSelectors
const { clear, add, play, pause } = queueActions

type ChatMessageTrackProps = {
  link: string
  isAuthor: boolean
}

export const ChatMessageTrack = ({ link, isAuthor }: ChatMessageTrackProps) => {
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)
  const currentQueueItem = useSelector(makeGetCurrent())
  const playing = useSelector(getPlaying)
  const permalink = getPathFromTrackUrl(link)

  const { data: track, status } = useGetTrackByPermalink(
    {
      permalink: permalink!,
      currentUserId: currentUserId!
    },
    { disabled: !permalink || !currentUserId }
  )

  const uid = useMemo(() => {
    return track ? makeUid(Kind.TRACKS, track.track_id) : ''
  }, [track])
  const isTrackPlaying =
    playing &&
    !!track &&
    !!currentQueueItem.track &&
    currentQueueItem.uid === uid

  const recordAnalytics = useCallback(
    ({ name, source }: { name: Name; source: PlaybackSource }) => {
      if (!track) return
      dispatch(
        make(name, {
          id: `${track.track_id}`,
          source
        })
      )
    },
    [dispatch, track]
  )

  const onTogglePlay = useCallback(() => {
    if (!track) return
    if (isTrackPlaying) {
      dispatch(pause({}))
      recordAnalytics({
        name: Name.PLAYBACK_PAUSE,
        source: PlaybackSource.CHAT_TRACK
      })
    } else if (
      currentQueueItem.uid !== uid &&
      currentQueueItem.track &&
      currentQueueItem.uid === uid
    ) {
      dispatch(play({}))
      recordAnalytics({
        name: Name.PLAYBACK_PLAY,
        source: PlaybackSource.CHAT_TRACK
      })
    } else {
      dispatch(clear({}))
      dispatch(
        add({
          entries: [
            { id: track.track_id, uid, source: QueueSource.CHAT_TRACKS }
          ]
        })
      )
      dispatch(play({ uid }))
      recordAnalytics({
        name: Name.PLAYBACK_PLAY,
        source: PlaybackSource.CHAT_TRACK
      })
    }
  }, [dispatch, recordAnalytics, track, isTrackPlaying, currentQueueItem, uid])

  return track ? (
    <div className={cn(styles.container, { [styles.isAuthor]: isAuthor })}>
      {/* You may wonder why we use the mobile web track tile here.
      It's simply because the chat track tile uses the same design as mobile web. */}
      <MobileTrackTile
        index={0}
        togglePlay={onTogglePlay}
        uid={uid}
        isLoading={status === Status.LOADING || status === Status.IDLE}
        hasLoaded={() => {}}
        isTrending={false}
        showRankIcon={false}
        showArtistPick={false}
        isActive={isTrackPlaying}
        isChat
      />
    </div>
  ) : null
}
