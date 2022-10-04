import { useCallback } from 'react'

import type { ID, UID } from '@audius/common'
import {
  playerSelectors,
  Status,
  Name,
  PlaybackSource,
  lineupSelectors,
  historyPageTracksLineupActions as tracksActions,
  historyPageSelectors,
  useProxySelector
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import { Screen, Tile, VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { TrackList } from 'app/components/track-list'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
const { getPlaying, getUid } = playerSelectors
const { getHistoryTracksLineup } = historyPageSelectors
const { makeGetTableMetadatas } = lineupSelectors

const messages = {
  title: 'Listening History',
  noHistoryMessage: "You haven't listened to any tracks yet"
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

  const fetchListeningHistory = useCallback(() => {
    dispatch(tracksActions.fetchLineupMetadatas())
  }, [dispatch])

  useFocusEffect(fetchListeningHistory)

  const { status, entries } = useProxySelector(getTracks, [])

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
        {status === Status.SUCCESS && entries.length === 0 ? (
          <EmptyTileCTA message={messages.noHistoryMessage} />
        ) : (
          <VirtualizedScrollView listKey='listening-history-screen'>
            <Tile
              styles={{
                root: styles.container,
                tile: styles.trackListContainer
              }}
            >
              <TrackList
                tracks={entries}
                showDivider
                togglePlay={togglePlay}
                trackItemAction='overflow'
              />
            </Tile>
          </VirtualizedScrollView>
        )}
      </WithLoader>
    </Screen>
  )
}
