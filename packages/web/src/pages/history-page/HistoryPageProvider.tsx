import {
  useState,
  useCallback,
  useMemo,
  ChangeEvent,
  ComponentType
} from 'react'

import { useTrackHistory } from '@audius/common/api'
import {
  Name,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  ID,
  UID,
  LineupTrack,
  Status
} from '@audius/common/models'
import {
  accountSelectors,
  lineupSelectors,
  historyPageSelectors,
  queueSelectors,
  tracksSocialActions as socialActions
} from '@audius/common/store'
import { isEqual } from 'lodash'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { useRecord, make } from 'common/store/analytics/actions'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'
import { withNullGuard } from 'utils/withNullGuard'

import { HistoryPageProps as DesktopHistoryPageProps } from './components/desktop/HistoryPage'
import { HistoryPageProps as MobileHistoryPageProps } from './components/mobile/HistoryPage'

const { makeGetCurrent } = queueSelectors
const { getHistoryTracksLineup } = historyPageSelectors
const { makeGetTableMetadatas } = lineupSelectors
const getUserId = accountSelectors.getUserId

const pageSize = 15

const messages = {
  title: 'History',
  description: 'View your listening history'
}

type OwnProps = {
  children:
    | ComponentType<MobileHistoryPageProps>
    | ComponentType<DesktopHistoryPageProps>
}

type HistoryPageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const g = withNullGuard(
  ({ userId, ...p }: HistoryPageProps) => userId !== null && { ...p, userId }
)

const HistoryPage = g((props) => {
  const {
    userId,
    goToRoute,
    tracks,
    currentQueueItem,
    saveTrack,
    unsaveTrack,
    repostTrack,
    undoRepostTrack
  } = props

  const { entries } = tracks
  const record = useRecord()

  const [filterText, setFilterText] = useState('')
  const onFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilterText(e.target.value)
    },
    [setFilterText]
  )

  const {
    play,
    pause,
    togglePlay,
    updateLineupOrder,
    isPlaying,
    status,
    loadNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    lineup
  } = useTrackHistory({
    query: filterText,
    pageSize
  })

  const formatMetadata = (lineupEntries: any) => {
    return lineupEntries.map((entry: any, i: number) => ({
      ...entry,
      key: `${entry.title}_${entry.dateListened}_${i}`,
      name: entry.title,
      artist: entry.user.name,
      handle: entry.user.handle,
      date: entry.dateListened,
      time: entry.duration,
      plays: entry.play_count
    }))
  }

  const getFilteredData = useCallback(
    (trackMetadatas: any) => {
      const filteredMetadata = formatMetadata(trackMetadatas).filter(
        (entry: any) =>
          entry.title.toLowerCase().indexOf(filterText.toLowerCase()) > -1 ||
          entry.user.name.toLowerCase().indexOf(filterText.toLowerCase()) > -1
      )
      const filteredIndex = filteredMetadata.findIndex(
        (metadata: any) => metadata.uid === currentQueueItem.uid
      )
      return [filteredMetadata, filteredIndex] as const
    },
    [currentQueueItem, filterText]
  )

  const [dataSource, playingIndex] = useMemo(
    () => (status === Status.SUCCESS ? getFilteredData(entries) : [[], -1]),
    [entries, getFilteredData, status]
  )

  const onClickRow = useCallback(
    (trackRecord: any) => {
      if (trackRecord.uid === currentQueueItem.uid && isPlaying) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${trackRecord.track_id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        play(trackRecord.uid)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${trackRecord.track_id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [pause, play, currentQueueItem, record, isPlaying]
  )

  const onClickSave = useCallback(
    (record: any) => {
      if (!record.has_current_user_saved) {
        saveTrack(record.track_id)
      } else {
        unsaveTrack(record.track_id)
      }
    },
    [saveTrack, unsaveTrack]
  )

  const onToggleSave = useCallback(
    (isSaved: boolean, trackId: ID) => {
      if (!isSaved) {
        saveTrack(trackId)
      } else {
        unsaveTrack(trackId)
      }
    },
    [saveTrack, unsaveTrack]
  )

  const onTogglePlay = useCallback(
    (uid: UID, trackId: ID) => {
      togglePlay(uid, trackId)
      record(
        make(
          uid === currentQueueItem.uid && isPlaying
            ? Name.PLAYBACK_PAUSE
            : Name.PLAYBACK_PLAY,
          {
            id: `${trackId}`,
            source: PlaybackSource.HISTORY_PAGE
          }
        )
      )
    },
    [togglePlay, currentQueueItem, record, isPlaying]
  )

  const onClickRepost = useCallback(
    (record: any) => {
      if (!record.has_current_user_reposted) {
        repostTrack(record.track_id)
      } else {
        undoRepostTrack(record.track_id)
      }
    },
    [repostTrack, undoRepostTrack]
  )

  const isQueued = useCallback(() => {
    return tracks.entries.some(
      (entry: any) => currentQueueItem.uid === entry.uid
    )
  }, [tracks, currentQueueItem])

  const getPlayingUid = useCallback(() => {
    return currentQueueItem.uid
  }, [currentQueueItem])

  const onPlay = useCallback(() => {
    const isLineupQueued = isQueued()
    if (isLineupQueued && isPlaying) {
      pause()
    } else if (entries.length > 0) {
      play(entries[0].uid)
    }
  }, [isQueued, pause, play, entries, isPlaying])

  const onSortTracks = (sorters: any) => {
    const { column, order } = sorters
    const dataSource = formatMetadata(entries)
    let updatedOrder
    if (!column) {
      updatedOrder = entries.map((entry: any) => entry.uid)
    } else {
      updatedOrder = dataSource
        .sort((a: any, b: any) =>
          order === 'ascend' ? column.sorter(a, b) : column.sorter(b, a)
        )
        .map((metadata: any) => metadata.uid)
    }
    updateLineupOrder(updatedOrder)
  }

  const isEmpty = entries.length === 0
  const queuedAndPlaying = isPlaying && isQueued()

  const totalRowCount = useMemo(() => {
    if (!hasNextPage) {
      return entries.length
    }
    // If we have next page, add buffer for more items
    return entries.length + pageSize
  }, [entries.length, hasNextPage])

  const childProps = {
    title: messages.title,
    description: messages.description,
    loading: isLoading,
    entries: entries as unknown as LineupTrack[],
    queuedAndPlaying,
    playingIndex,
    dataSource,
    isEmpty,
    goToRoute,
    currentQueueItem,
    onFilterChange,
    formatMetadata,
    getPlayingUid,
    isQueued,
    fetchNextPage: loadNextPage,
    isFetchingNextPage,
    totalRowCount,
    pageSize
  }

  const mobileProps = {
    playing: isPlaying,
    onToggleSave,
    onTogglePlay
  }

  const desktopProps = {
    userId,
    onPlay,
    filterText,
    onClickRepost,
    getFilteredData,
    onClickSave,
    onClickRow,
    onSortTracks
  }

  return null
  // <props.children
  //   key={userId}
  //   {...childProps}
  //   {...mobileProps}
  //   {...desktopProps}
  // />
})

const getLineupMetadatas = makeGetTableMetadatas(getHistoryTracksLineup)
type LineupData = ReturnType<typeof getLineupMetadatas>
let tracksRef: LineupData

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    const tracks = getLineupMetadatas(state)

    if (!isEqual(tracksRef, tracks)) {
      tracksRef = tracks
    }

    const output = {
      userId: getUserId(state),
      tracks: tracksRef,
      currentQueueItem: getCurrentQueueItem(state)
    }

    return output
  }
  return mapStateToProps
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  goToRoute: (route: string) => dispatch(push(route)),
  repostTrack: (trackId: ID) =>
    dispatch(socialActions.repostTrack(trackId, RepostSource.HISTORY_PAGE)),
  undoRepostTrack: (trackId: ID) =>
    dispatch(socialActions.undoRepostTrack(trackId, RepostSource.HISTORY_PAGE)),
  saveTrack: (trackId: ID) =>
    dispatch(socialActions.saveTrack(trackId, FavoriteSource.HISTORY_PAGE)),
  unsaveTrack: (trackId: ID) =>
    dispatch(socialActions.unsaveTrack(trackId, FavoriteSource.HISTORY_PAGE))
})

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(HistoryPage)
)
