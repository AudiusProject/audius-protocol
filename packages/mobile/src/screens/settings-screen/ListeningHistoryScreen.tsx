import { useCallback, useMemo } from 'react'

import {
  historyPageTracksLineupActions as tracksActions,
  historyPageSelectors
} from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import { PlaybackSource, Status } from '@audius/common/models'
import type { ID, UID } from '@audius/common/models'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import IconListeningHistory from 'app/assets/images/iconListeningHistory.svg'
import {
  Screen,
  ScreenContent,
  Tile,
  VirtualizedScrollView
} from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { TrackList } from 'app/components/track-list'
import { WithLoader } from 'app/components/with-loader/WithLoader'
import { makeStyles } from 'app/styles'
const { getHistoryTracksLineup } = historyPageSelectors

const messages = {
  title: 'Listening History',
  noHistoryMessage: "You haven't listened to any tracks yet"
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
  }
}))

export const ListeningHistoryScreen = () => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const fetchListeningHistory = useCallback(() => {
    dispatch(tracksActions.fetchLineupMetadatas())
  }, [dispatch])

  useFocusEffect(fetchListeningHistory)

  const { status, entries } = useProxySelector(getHistoryTracksLineup, [])
  const trackUids = useMemo(() => entries.map(({ uid }) => uid), [entries])

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      dispatch(tracksActions.togglePlay(uid, id, PlaybackSource.HISTORY_PAGE))
    },
    [dispatch]
  )

  return (
    <Screen
      title={messages.title}
      icon={IconListeningHistory}
      topbarRight={null}
      variant='secondary'
    >
      <ScreenContent>
        <WithLoader loading={status === Status.LOADING}>
          {status === Status.SUCCESS && entries.length === 0 ? (
            <EmptyTileCTA message={messages.noHistoryMessage} />
          ) : (
            <VirtualizedScrollView>
              <Tile
                styles={{
                  root: styles.container,
                  tile: styles.trackListContainer
                }}
              >
                <TrackList
                  uids={trackUids}
                  showDivider
                  togglePlay={togglePlay}
                  trackItemAction='overflow'
                />
              </Tile>
            </VirtualizedScrollView>
          )}
        </WithLoader>
      </ScreenContent>
    </Screen>
  )
}
