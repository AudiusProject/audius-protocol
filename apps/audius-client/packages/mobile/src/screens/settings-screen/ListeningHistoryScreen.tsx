import { useCallback } from 'react'

import type { ID, UID } from '@audius/common'
import { Status, Name, PlaybackSource } from '@audius/common'
import { makeGetTableMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/history-page/lineups/tracks/actions'
import { getHistoryTracksLineup } from 'audius-client/src/common/store/pages/history-page/selectors'
import { useSelector } from 'react-redux'

import { Screen, Tile, VirtualizedScrollView } from 'app/components/core'
import { TrackList } from 'app/components/track-list'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'
import { makeStyles } from 'app/styles'
import { make, track } from 'app/utils/analytics'

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
  const dispatchWeb = useDispatchWeb()
  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const historyTracks = useSelectorWeb(getTracks)

  const status = historyTracks.status

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      const isTrackPlaying = uid === playingUid && isPlaying
      if (!isTrackPlaying) {
        dispatchWeb(tracksActions.play(uid))
        track(
          make({
            eventName: Name.PLAYBACK_PLAY,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      } else {
        dispatchWeb(tracksActions.pause())
        track(
          make({
            eventName: Name.PLAYBACK_PAUSE,
            id: `${id}`,
            source: PlaybackSource.HISTORY_PAGE
          })
        )
      }
    },
    [dispatchWeb, isPlaying, playingUid]
  )

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <WithLoader loading={status === Status.LOADING}>
        <VirtualizedScrollView listKey='listening-history-screen'>
          <Tile
            styles={{
              root: styles.container,
              tile: styles.trackListContainer
            }}>
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
