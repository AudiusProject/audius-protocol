import { useCallback, useMemo, useState } from 'react'

import type { ID, UID } from '@audius/common'
import {
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
import { useDispatch, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { TrackList } from 'app/components/track-list'
import type { TrackMetadata } from 'app/components/track-list/types'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useOfflineCollectionLineup } from 'app/hooks/useLoadOfflineTracks'
import { make, track } from 'app/services/analytics'
import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'
import { makeStyles } from 'app/styles'

import { FilterInput } from './FilterInput'
const { getPlaying, getUid } = playerSelectors
const { saveTrack, unsaveTrack } = tracksSocialActions
const { getSavedTracksLineup, getSavedTracksStatus } = savedPageSelectors
const { fetchSaves } = savedPageActions
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

export const TracksTab = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
  const isReachable = useSelector(getIsReachable)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const handleFetchSaves = useCallback(() => {
    dispatch(fetchSaves())
  }, [dispatch])

  useFocusEffect(handleFetchSaves)
  useOfflineCollectionLineup(DOWNLOAD_REASON_FAVORITES)

  const [filterValue, setFilterValue] = useState('')
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getUid)
  const savedTracksStatus = useSelector(getSavedTracksStatus)
  const savedTracks = useProxySelector(getTracks, [])
  const offlineTracks = useSelector(getOfflineTracks)

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

  const isLoading = savedTracksStatus !== Status.SUCCESS
  const tracks = useMemo(
    () =>
      !isReachable && isOfflineModeEnabled
        ? Object.values(offlineTracks).filter((track) =>
            track.offline?.reasons_for_download.some(
              (reason) => reason.collection_id === DOWNLOAD_REASON_FAVORITES
            )
          )
        : savedTracks.entries,
    [isOfflineModeEnabled, isReachable, offlineTracks, savedTracks.entries]
  )
  const hasNoFavorites = tracks.length === 0

  return (
    <WithLoader loading={isLoading}>
      <VirtualizedScrollView listKey='favorites-screen'>
        {!isLoading && hasNoFavorites && !filterValue ? (
          <EmptyTileCTA message={messages.emptyTabText} />
        ) : (
          <>
            <FilterInput
              value={filterValue}
              placeholder={messages.inputPlaceholder}
              onChangeText={setFilterValue}
            />
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
                  tracks={tracks.filter(filterTrack)}
                  hideArt
                />
              </Tile>
            ) : null}
          </>
        )}
      </VirtualizedScrollView>
    </WithLoader>
  )
}
