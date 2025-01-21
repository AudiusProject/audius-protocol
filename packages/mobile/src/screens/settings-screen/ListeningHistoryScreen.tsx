import { useState } from 'react'

import { useTrackHistory } from '@audius/common/api'
import { useDebouncedCallback } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { historyPageSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

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
  const [filterValue, setFilterValue] = useState('')

  const { fetchNextPage, togglePlay } = useTrackHistory({
    query: filterValue
  })

  const { status, entries } = useSelector(getHistoryTracksLineup)

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
              showSkeleton={status !== Status.SUCCESS && entries.length === 0}
            />
          </Paper>
        )}
      </ScreenContent>
    </Screen>
  )
}
