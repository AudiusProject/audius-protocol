import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ChangeEvent,
  ComponentType
} from 'react'

import {
  Name,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  Status,
  ID,
  UID,
  LineupTrack
} from '@audius/common/models'
import {
  accountSelectors,
  lineupSelectors,
  historyPageTracksLineupActions as tracksActions,
  historyPageSelectors,
  queueSelectors,
  tracksSocialActions as socialActions,
  playerSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { isEqual } from 'lodash'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { useRecord, make } from 'common/store/analytics/actions'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'
import { withNullGuard } from 'utils/withNullGuard'
import { withRouter, RouteComponentProps } from 'utils/withRouter'

import { HistoryPageProps as DesktopHistoryPageProps } from './components/desktop/HistoryPage'
import { HistoryPageProps as MobileHistoryPageProps } from './components/mobile/HistoryPage'
const { profilePage } = route
const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const { getHistoryTracksLineup } = historyPageSelectors
const { makeGetTableMetadatas } = lineupSelectors
const getUserId = accountSelectors.getUserId

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
    pause,
    play,
    playing,
    userId,
    goToRoute,
    tracks,
    currentQueueItem,
    updateLineupOrder,
    fetchHistoryTrackMetadata,
    saveTrack,
    unsaveTrack,
    repostTrack,
    undoRepostTrack
  } = props

  const { entries, status } = tracks
  const record = useRecord()

  const [filterText, setFilterText] = useState('')
  const onFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilterText(e.target.value)
    },
    [setFilterText]
  )

  useEffect(() => {
    fetchHistoryTrackMetadata()
  }, [fetchHistoryTrackMetadata])

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

  const [initialOrder, setInitialOrder] = useState<UID[]>([])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setInitialOrder(dataSource.map((metadata: any) => metadata.uid))
    }
  }, [status, dataSource])

  const onClickRow = useCallback(
    (trackRecord: any) => {
      if (playing && trackRecord.uid === currentQueueItem.uid) {
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
    [playing, pause, play, currentQueueItem, record]
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
      if (playing && uid === currentQueueItem.uid) {
        pause()
        record(
          make(Name.PLAYBACK_PAUSE, {
            id: `${trackId}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        play(uid)
        record(
          make(Name.PLAYBACK_PLAY, {
            id: `${trackId}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [playing, play, pause, currentQueueItem, record]
  )

  const onClickTrackName = useCallback(
    (record: any) => {
      goToRoute(record.permalink)
    },
    [goToRoute]
  )

  const onClickArtistName = useCallback(
    (record: any) => {
      goToRoute(profilePage(record.handle))
    },
    [goToRoute]
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
    if (playing && isLineupQueued) {
      pause()
    } else if (!playing && isLineupQueued) {
      play()
    } else if (entries.length > 0) {
      play(entries[0].uid)
    }
  }, [isQueued, pause, play, playing, entries])

  const onSortTracks = (sorters: any) => {
    const { column, order } = sorters
    const dataSource = formatMetadata(entries)
    let updatedOrder
    if (!column) {
      updatedOrder = initialOrder
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
  const loading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()

  const childProps = {
    title: messages.title,
    description: messages.description,
    loading,
    entries: entries as unknown as LineupTrack[],
    queuedAndPlaying,
    playingIndex,
    dataSource,

    isEmpty,
    goToRoute,
    currentQueueItem,

    // Methods
    onFilterChange,
    formatMetadata,
    getPlayingUid,
    isQueued
  }

  const mobileProps = {
    playing,
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
    onClickTrackName,
    onClickArtistName,
    onSortTracks
  }

  return (
    <props.children
      key={userId}
      {...childProps}
      {...mobileProps}
      {...desktopProps}
    />
  )
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
      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state)
    }

    return output
  }
  return mapStateToProps
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchHistoryTrackMetadata: () =>
    dispatch(tracksActions.fetchLineupMetadatas()),
  play: (uid?: UID) => dispatch(tracksActions.play(uid)),
  pause: () => dispatch(tracksActions.pause()),
  goToRoute: (route: string) => dispatch(push(route)),
  updateLineupOrder: (updatedOrderIndices: any) =>
    dispatch(tracksActions.updateLineupOrder(updatedOrderIndices)),
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
