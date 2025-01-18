import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTrackHistory } from '@audius/common/api'
import {
  useDebouncedCallback,
  useThrottledCallback
} from '@audius/common/hooks'
import { PlaybackSource, Status } from '@audius/common/models'
import type { ID, UID } from '@audius/common/models'
import {
  historyPageTracksLineupActions as tracksActions,
  historyPageSelectors
} from '@audius/common/store'
import { debounce } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { Divider, IconListeningHistory, Paper } from '@audius/harmony-native'
import { Screen, ScreenContent } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { FilterInput } from 'app/components/filter-input'
import { TrackList } from 'app/components/track-list'

const { getHistoryTracksLineup } = historyPageSelectors

const messages = {
  title: 'Listening History',
  noHistoryMessage: "You haven't listened to any tracks yet",
  inputPlaceholder: 'Filter Tracks'
}

export const ListeningHistoryScreen = () => {
  const dispatch = useDispatch()
  const [filterValue, setFilterValue] = useState('')

  const {
    data: trackPages,
    fetchNextPage,
    isLoading: isLoadingInitial
  } = useTrackHistory({
    query: filterValue
  })

  // Get the actual limit from the first page length
  const limit = trackPages?.pages[0]?.length ?? 0
  // Calculate offset based on number of pages * limit
  const offset = (trackPages?.pages.length ?? 0) * limit
  // Get the latest page of tracks
  const latestTracks = trackPages?.pages[trackPages.pages.length - 1] ?? []

  useEffect(() => {
    if (offset > 0 || limit > 0) {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          tracks: latestTracks
        })
      )
    }
  }, [dispatch, offset, limit, latestTracks])

  const { status, entries } = useSelector(getHistoryTracksLineup)

  const togglePlay = useCallback(
    (uid: UID, id: ID) => {
      dispatch(tracksActions.togglePlay(uid, id, PlaybackSource.HISTORY_PAGE))
    },
    [dispatch]
  )

  const handleChangeFilterValue = useDebouncedCallback(
    (value: string) => {
      setFilterValue(value)
    },
    [setFilterValue],
    250
  )

  return (
    <Screen
      title={messages.title}
      icon={IconListeningHistory}
      topbarRight={null}
      variant='secondary'
    >
      <ScreenContent>
        {status === Status.SUCCESS && entries.length === 0 ? (
          <EmptyTileCTA message={messages.noHistoryMessage} />
        ) : (
          <Paper m='l' gap='l'>
            <FilterInput
              placeholder={messages.inputPlaceholder}
              onChangeText={handleChangeFilterValue}
              shadow='flat'
              mb={0}
              mh='s'
            />
            <Divider />
            <TrackList
              uids={entries.map(({ uid }) => uid)}
              togglePlay={togglePlay}
              trackItemAction='overflow'
              onEndReached={() => fetchNextPage()}
              onEndReachedThreshold={0.5}
              showSkeleton={isLoadingInitial}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: null
              }}
            />
          </Paper>
        )}
      </ScreenContent>
    </Screen>
  )
}
