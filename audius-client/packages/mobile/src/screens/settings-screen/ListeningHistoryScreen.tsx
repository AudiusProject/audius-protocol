import { useCallback } from 'react'

import type { ID, UID } from '@audius/common'
import {
  historyPageTracksLineupActions,
  playerSelectors,
  Status,
  Name,
  PlaybackSource,
  lineupSelectors,
  historyPageTracksLineupActions as tracksActions,
  historyPageSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { Screen, Tile, VirtualizedScrollView } from 'app/components/core'
import { TrackList } from 'app/components/track-list'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
const { getPlaying, getUid } = playerSelectors
const { getHistoryTracksLineup } = historyPageSelectors
const { makeGetTableMetadatas } = lineupSelectors

const messages = {
  title: 'Listening History'
}
const getTracks = makeGetTableMetadatas(getHistoryTracksLineup)

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
  }
}))

export const ListeningHistoryScreen = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getUid)

  useEffectOnce(() => {
    dispatch(historyPageTracksLineupActions.fetchLineupMetadatas())
  })

  const historyTracks = useSelector(getTracks)

  const status = historyTracks.status

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      const isTrackPlaying = uid === playingUid && isPlaying
      if (!isTrackPlaying) {
        dispatch(tracksActions.play(uid))
        track(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        dispatch(tracksActions.pause())
        track(
          make({
            eventName: Name.PLAYBACK_PAUSE,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [dispatch, isPlaying, playingUid]
  )

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <WithLoader loading={status === Status.LOADING}>
        <VirtualizedScrollView listKey='listening-history-screen'>
          <Tile
            styles={{
              root: styles.container,
              tile: styles.trackListContainer
            }}
          >
            <TrackList
              tracks={historyTracks.entries}
              showDivider
              togglePlay={togglePlay}
              trackItemAction='overflow'
            />
          </Tile>
        </VirtualizedScrollView>
      </WithLoader>
    </Screen>
  )
}
