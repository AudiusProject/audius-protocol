import { useCallback, useState } from 'react'

import type { ID, UID } from '@audius/common'
import {
  Status,
  FavoriteSource,
  Name,
  PlaybackSource,
  lineupSelectors,
  savedPageTracksLineupActions as tracksActions,
  savedPageSelectors,
  tracksSocialActions
} from '@audius/common'
import { shallowEqual, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import { TrackList } from 'app/components/track-list'
import type { TrackMetadata } from 'app/components/track-list/types'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make, track } from 'app/services/analytics'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'
import { makeStyles } from 'app/styles'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
const { saveTrack, unsaveTrack } = tracksSocialActions
const { getSavedTracksLineup, getSavedTracksStatus } = savedPageSelectors
const { makeGetTableMetadatas } = lineupSelectors

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
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()
  const [filterValue, setFilterValue] = useState('')
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const savedTracksStatus = useSelectorWeb(getSavedTracksStatus)
  const savedTracks = useSelectorWeb(getTracks, shallowEqual)

  const filterTrack = (track: TrackMetadata) => {
    const matchValue = filterValue.toLowerCase()
    return (
      track.title.toLowerCase().indexOf(matchValue) > -1 ||
      track.user.name.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const onToggleSave = useCallback(
    (isSaved: boolean, trackId: ID) => {
      if (trackId === undefined) return
      const action = isSaved ? unsaveTrack : saveTrack
      dispatchWeb(action(trackId, FavoriteSource.FAVORITES_PAGE))
    },
    [dispatchWeb]
  )

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      if (uid !== playingUid || (uid === playingUid && !isPlaying)) {
        dispatchWeb(tracksActions.play(uid))
        track(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      } else if (uid === playingUid && isPlaying) {
        dispatchWeb(tracksActions.pause())
        track(
          make({
            eventName: Name.PLAYBACK_PAUSE,
            id: `${id}`,
            source: PlaybackSource.FAVORITES_PAGE
          })
        )
      }
    },
    [dispatchWeb, isPlaying, playingUid]
  )

  return (
    <WithLoader
      loading={
        savedTracksStatus === Status.LOADING && savedTracks.entries.length === 0
      }
    >
      <VirtualizedScrollView listKey='favorites-screen'>
        {!savedTracks.entries.length && !filterValue ? (
          <EmptyTab message={messages.emptyTabText} />
        ) : (
          <>
            <FilterInput
              value={filterValue}
              placeholder={messages.inputPlaceholder}
              onChangeText={setFilterValue}
            />
            {savedTracks.entries.length ? (
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
                  tracks={savedTracks.entries.filter(filterTrack)}
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
