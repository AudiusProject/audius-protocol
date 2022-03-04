import { useCallback, useState } from 'react'

import {
  FavoriteSource,
  Name,
  PlaybackSource
} from 'audius-client/src/common/models/Analytics'
import { ID, UID } from 'audius-client/src/common/models/Identifiers'
import { LineupState } from 'audius-client/src/common/models/Lineup'
import Status from 'audius-client/src/common/models/Status'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { CommonState } from 'audius-client/src/common/store'
import { getTracks } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUsers } from 'audius-client/src/common/store/cache/users/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/saved-page/lineups/tracks/actions'
import {
  getSavedTracksLineup,
  getSavedTracksStatus
} from 'audius-client/src/common/store/pages/saved-page/selectors'
import {
  saveTrack,
  unsaveTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import { View } from 'react-native'
import { shallowEqual, useSelector } from 'react-redux'

import { Tile, VirtualizedScrollView } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { TrackList } from 'app/components/track-list'
import { ListTrackMetadata } from 'app/components/track-list/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'
import { makeStyles } from 'app/styles'
import { make, track } from 'app/utils/analytics'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'

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

export const TracksTab = ({ navigation }) => {
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()
  const [filterValue, setFilterValue] = useState('')
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const savedTracksStatus = useSelectorWeb(getSavedTracksStatus)
  const savedTracks: LineupState<Track> = useSelectorWeb(getSavedTracksLineup)

  const trackIds = savedTracks.entries.map(e => e.id)
  const tracks = useSelectorWeb(
    (state: CommonState) => getTracks(state, { ids: trackIds }),
    shallowEqual
  ) as { [id: number]: Track }

  const creatorIds = Object.values(tracks).map(t => t.owner_id)
  const artists = useSelectorWeb(
    (state: CommonState) => getUsers(state, { ids: creatorIds }),
    shallowEqual
  ) as { [id: number]: User }

  const tracksWithUsers = Object.values(tracks).map(track => ({
    ...track,
    uid: savedTracks.entries.find(t => t.id === track.track_id)?.uid,
    user: artists[track.owner_id]
  }))

  const isQueued = () => {
    return tracksWithUsers.some((track: any) => playingUid === track.uid)
  }

  const queuedAndPlaying = isPlaying && isQueued

  const matchesFilter = (track: any) => {
    const matchValue = filterValue.toLowerCase()
    return (
      track.trackTitle.toLowerCase().indexOf(matchValue) > -1 ||
      track.artistName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const trackList: ListTrackMetadata[] = tracksWithUsers
    .map(track => ({
      isLoading: false,
      isSaved: track.has_current_user_saved,
      isReposted: track.has_current_user_reposted,
      isActive: playingUid === track.uid,
      isPlaying: queuedAndPlaying && playingUid === track.uid,
      artistName: track.user.name,
      artistHandle: track.user.handle,
      trackTitle: track.title,
      trackId: track.track_id,
      uid: track.uid,
      isDeleted: track.is_delete || !!track.user.is_deactivated,
      user: track.user
    }))
    .filter(track => matchesFilter(track))

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

  // TODO: Use the dot spinner
  if (savedTracksStatus === Status.LOADING) {
    return (
      <View style={styles.spinnerContainer}>
        <LoadingSpinner />
      </View>
    )
  }

  return (
    <VirtualizedScrollView listKey='favorites-screen'>
      {!trackList.length && !filterValue ? (
        <EmptyTab message={messages.emptyTabText} />
      ) : (
        <>
          <FilterInput
            value={filterValue}
            placeholder={messages.inputPlaceholder}
            onChangeText={setFilterValue}
          />
          {trackList.length ? (
            <Tile
              styles={{
                root: styles.container,
                tile: styles.trackListContainer
              }}
            >
              <TrackList
                tracks={trackList ?? []}
                showDivider
                onSave={onToggleSave}
                togglePlay={togglePlay}
                trackItemAction='save'
              />
            </Tile>
          ) : null}
        </>
      )}
    </VirtualizedScrollView>
  )
}
