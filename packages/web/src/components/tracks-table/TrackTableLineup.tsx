import { useCallback, useMemo } from 'react'

import type { LineupQueryData } from '@audius/common/api'
import {
  Name,
  PlaybackSource,
  FavoriteSource,
  RepostSource,
  LineupTrack,
  UserTrackMetadata,
  Kind,
  LineupEntry
} from '@audius/common/models'
import {
  playerSelectors,
  queueSelectors,
  tracksSocialActions
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'

import { TracksTable } from './TracksTable'
import type { TracksTableProps, TrackWithUID } from './types'

const { getBuffering } = playerSelectors
const { makeGetCurrent } = queueSelectors

const defaultLineup = {
  entries: [] as LineupTrack[],
  status: 'LOADING',
  hasMore: true,
  inView: true,
  page: 0,
  isMetadataLoading: false
}

type TrackTableLineupProps = Omit<
  TracksTableProps,
  | 'onClickFavorite'
  | 'onClickRepost'
  | 'playing'
  | 'activeIndex'
  | 'onClickRow'
  | 'data'
> & {
  playingSource?: PlaybackSource
  lineupQueryData: LineupQueryData
}

export const TrackTableLineup = ({
  playingSource = PlaybackSource.TRACK_TILE,
  lineupQueryData,
  ...props
}: TrackTableLineupProps) => {
  const dispatch = useDispatch()

  const {
    lineup = defaultLineup,
    play,
    pause,
    loadNextPage,
    isPlaying,
    isInitialLoading,
    data,
    hasNextPage,
    pageSize
  } = lineupQueryData

  const tracks = data as UserTrackMetadata[] | null

  // Get current queue item
  const getCurrentQueueItem = useMemo(() => makeGetCurrent(), [])
  const currentQueueItem = useSelector(getCurrentQueueItem)
  const isBuffering = useSelector(getBuffering)

  // Merge lineup entries with their corresponding track data
  const entries = useMemo(() => {
    if (lineup.entries.length === 0 || !tracks || tracks.length === 0) return []

    const entries = (lineup.entries as LineupEntry<LineupTrack>[]).map(
      (entry) => {
        const track = tracks.find((track) => track.track_id === entry.id)
        return {
          ...entry,
          ...track
        }
      }
    )
    return hasNextPage
      ? entries.concat(new Array(pageSize).fill({ kind: Kind.EMPTY }))
      : entries
  }, [lineup.entries, tracks, hasNextPage, pageSize])

  // Get the active index by finding the current track in the data
  const activeIndex = useMemo(() => {
    if (!currentQueueItem?.uid) return -1
    return entries.findIndex((track) => track.uid === currentQueueItem.uid)
  }, [currentQueueItem?.uid, entries])

  const onClickFavorite = useCallback(
    (track: TrackWithUID) => {
      const trackId = track.track_id
      if (!track.has_current_user_saved) {
        dispatch(
          tracksSocialActions.saveTrack(trackId, FavoriteSource.TRACK_PAGE)
        )
      } else {
        dispatch(
          tracksSocialActions.unsaveTrack(trackId, FavoriteSource.TRACK_PAGE)
        )
      }
    },
    [dispatch]
  )

  const onClickRepost = useCallback(
    (track: TrackWithUID) => {
      const trackId = track.track_id
      if (!track.has_current_user_reposted) {
        dispatch(
          tracksSocialActions.repostTrack(trackId, RepostSource.TRACK_PAGE)
        )
      } else {
        dispatch(
          tracksSocialActions.undoRepostTrack(trackId, RepostSource.TRACK_PAGE)
        )
      }
    },
    [dispatch]
  )

  const onClickRow = useCallback(
    (track: TrackWithUID, index: number) => {
      if (index === activeIndex && isPlaying) {
        pause()
        dispatch(
          make(Name.PLAYBACK_PAUSE, {
            id: `${track.track_id}`,
            source: playingSource
          })
        )
      } else {
        play(entries[index].uid)
        dispatch(
          make(Name.PLAYBACK_PLAY, {
            id: `${track.track_id}`,
            source: playingSource
          })
        )
      }
    },
    [dispatch, isPlaying, pause, play, playingSource, activeIndex, entries]
  )

  return (
    <TracksTable
      {...props}
      data={entries}
      onClickFavorite={onClickFavorite}
      onClickRepost={onClickRepost}
      playing={isPlaying && !isBuffering}
      activeIndex={activeIndex}
      onClickRow={onClickRow}
      fetchMore={loadNextPage}
      loading={isInitialLoading}
      pageSize={pageSize}
      fetchBatchSize={pageSize}
      fetchThreshold={pageSize ? pageSize / 2 : undefined}
    />
  )
}
