import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ID, UID } from '@audius/common'
import {
  Kind,
  useProxySelector,
  savedPageActions,
  playerSelectors,
  Status,
  FavoriteSource,
  Name,
  PlaybackSource,
  lineupSelectors,
  savedPageTracksLineupActions as tracksActions,
  savedPageSelectors,
  tracksSocialActions,
  reachabilitySelectors
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { debounce } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import LoadingSpinner from 'app/components/loading-spinner'
import { TrackList } from 'app/components/track-list'
import type { TrackMetadata } from 'app/components/track-list/types'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useOfflineCollectionLineup } from 'app/hooks/useLoadOfflineTracks'
import { make, track } from 'app/services/analytics'
import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { FilterInput } from './FilterInput'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
const { getPlaying, getUid } = playerSelectors
const { saveTrack, unsaveTrack } = tracksSocialActions
const {
  getSavedTracksLineup,
  getSavedTracksStatus,
  getInitialFetchStatus,
  getIsFetchingMore,
  hasReachedEnd
} = savedPageSelectors
const { fetchSaves, fetchMoreSaves } = savedPageActions
const { makeGetTableMetadatas } = lineupSelectors
const { getIsReachable } = reachabilitySelectors

const messages = {
  emptyTabText: "You haven't favorited any tracks yet.",
  inputPlaceholder: 'Filter Tracks'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    marginVertical: spacing(4),
    marginHorizontal: spacing(3),
    borderRadius: 6
  },
  trackListContainer: {
    backgroundColor: palette.white,
    borderRadius: 6,
    overflow: 'hidden'
  },
  spinnerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 48
  }
}))

const getTracks = makeGetTableMetadatas(getSavedTracksLineup)

const FETCH_LIMIT = 50

export const TracksTab = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
  const isReachable = useSelector(getIsReachable)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const [hasFetchedOnFocus, setHasFetchedOnFocus] = useState(false)
  const [filterValue, setFilterValue] = useState('')
  const [fetchPage, setFetchPage] = useState(0)
  const [allTracksFetched, setAllTracksFetched] = useState(false)
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getUid)
  const savedTracksStatus = useSelector(getSavedTracksStatus)
  const hasReachedFavoritesEnd = useSelector(hasReachedEnd)
  const initialFetch = useSelector(getInitialFetchStatus)
  const isFetchingMore = useSelector(getIsFetchingMore)
  const savedTracks = useProxySelector(getTracks, [])

  const isLoading = savedTracksStatus !== Status.SUCCESS
  const tracks = useMemo(
    () => savedTracks.entries as TrackMetadata[],
    [savedTracks.entries]
  )

  const debouncedFetchSaves = useMemo(() => {
    return debounce((filterVal) => {
      dispatch(fetchSaves(filterVal, '', '', 0, FETCH_LIMIT))
    }, 500)
  }, [dispatch])

  const handleFetchSavesOnline = useCallback(() => {
    debouncedFetchSaves(filterValue)
  }, [debouncedFetchSaves, filterValue])

  const handleFetchSavesOffline = useOfflineCollectionLineup(
    DOWNLOAD_REASON_FAVORITES,
    handleFetchSavesOnline,
    tracksActions
  )

  const handleFetchSaves = useCallback(() => {
    if (isOfflineModeEnabled && !isReachable) {
      handleFetchSavesOffline()
    } else {
      handleFetchSavesOnline()
    }
  }, [
    handleFetchSavesOffline,
    handleFetchSavesOnline,
    isOfflineModeEnabled,
    isReachable
  ])

  const handleMoreFetchSaves = useCallback(() => {
    if (
      allTracksFetched ||
      isLoading ||
      isFetchingMore ||
      (isOfflineModeEnabled && !isReachable) ||
      tracks.length < fetchPage * FETCH_LIMIT
    ) {
      return
    }

    const nextPage = fetchPage + 1
    dispatch(
      fetchMoreSaves(filterValue, '', '', nextPage * FETCH_LIMIT, FETCH_LIMIT)
    )
    setFetchPage(nextPage)
  }, [
    allTracksFetched,
    dispatch,
    fetchPage,
    filterValue,
    isFetchingMore,
    isLoading,
    isOfflineModeEnabled,
    isReachable,
    tracks.length
  ])

  useEffect(() => {
    const allTracks = tracks.every((track) => track.kind === Kind.TRACKS)

    if (allTracks && !allTracksFetched && !filterValue) {
      setAllTracksFetched(true)
    } else if (!allTracks && allTracksFetched) {
      setAllTracksFetched(false)
    }
  }, [allTracksFetched, filterValue, hasReachedFavoritesEnd, tracks])

  useEffect(() => {
    if (!allTracksFetched) handleFetchSaves()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValue])

  useFocusEffect(() => {
    if (!hasFetchedOnFocus) {
      setHasFetchedOnFocus(true)
      handleFetchSaves()
    }
  })

  const filterTrack = (track: TrackMetadata) => {
    const matchValue = filterValue?.toLowerCase()
    return (
      track.title?.toLowerCase().indexOf(matchValue) > -1 ||
      track.user?.name.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const onToggleSave = useCallback(
    (isSaved: boolean, trackId: ID) => {
      if (trackId === undefined) return
      const action = isSaved ? unsaveTrack : saveTrack
      dispatch(action(trackId, FavoriteSource.FAVORITES_PAGE))
    },
    [dispatch]
  )

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      if (uid !== playingUid || (uid === playingUid && !isPlaying)) {
        dispatch(tracksActions.play(uid))
        // TODO: store and queue events locally; upload on reconnect
        if (!isReachable && isOfflineModeEnabled) return
        track(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      } else if (uid === playingUid && isPlaying) {
        dispatch(tracksActions.pause())
        if (!isReachable && isOfflineModeEnabled) return
        track(
          make({
            eventName: Name.PLAYBACK_PAUSE,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      }
    },
    [playingUid, isPlaying, dispatch, isReachable, isOfflineModeEnabled]
  )

  const filteredTracks = allTracksFetched
    ? tracks.filter(filterTrack)
    : tracks.filter((track) => track.kind !== Kind.EMPTY)

  return (
    <VirtualizedScrollView listKey='favorites-screen'>
      {!isLoading && tracks.length === 0 && !filterValue ? (
        isOfflineModeEnabled && !isReachable ? (
          <NoTracksPlaceholder />
        ) : (
          <EmptyTileCTA message={messages.emptyTabText} />
        )
      ) : (
        <>
          <OfflineContentBanner />
          <FilterInput
            value={filterValue}
            placeholder={messages.inputPlaceholder}
            onChangeText={setFilterValue}
          />
          <WithLoader loading={initialFetch}>
            <>
              {tracks.length ? (
                <Tile
                  styles={{
                    root: styles.container,
                    tile: styles.trackListContainer
                  }}
                >
                  <TrackList
                    onSave={onToggleSave}
                    showDivider
                    togglePlay={togglePlay}
                    trackItemAction='save'
                    tracks={filteredTracks}
                    onEndReachedThreshold={1.5}
                    onEndReached={handleMoreFetchSaves}
                    hideArt
                  />
                </Tile>
              ) : null}
              {isFetchingMore ? (
                <LoadingSpinner
                  style={{
                    alignSelf: 'center',
                    marginTop: spacing(1),
                    marginBottom: spacing(8)
                  }}
                />
              ) : null}
            </>
          </WithLoader>
        </>
      )}
    </VirtualizedScrollView>
  )
}
