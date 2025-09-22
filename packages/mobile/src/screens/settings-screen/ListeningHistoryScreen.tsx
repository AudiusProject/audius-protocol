import { useState } from 'react'

import { useTrackHistory } from '@audius/common/api'
import { useDebouncedCallback } from '@audius/common/hooks'

import { IconListeningHistory, Paper } from '@audius/harmony-native'
import { EmptyTile, Screen, ScreenContent } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { FilterInput } from 'app/components/filter-input'
import { TrackList } from 'app/components/track-list'

const messages = {
  title: 'Listening History',
  noHistoryMessage: "You haven't listened to any tracks yet",
  noResultsMessage: 'No tracks match your search',
  inputPlaceholder: 'Filter Tracks'
}

export const ListeningHistoryScreen = () => {
  const [filterValue, setFilterValue] = useState('')

  const {
    loadNextPage,
    togglePlay,
    isPending,
    hasNextPage,
    pageSize,
    lineup: { entries }
  } = useTrackHistory({
    query: filterValue
  })

  const handleChangeFilterValue = useDebouncedCallback(
    (value: string) => {
      setFilterValue(value)
    },
    [setFilterValue],
    100
  )

  const showEmptyMessage = !isPending && entries.length === 0
  const showNoResults = showEmptyMessage && filterValue.length > 0
  const showNoHistory = showEmptyMessage && !filterValue

  return (
    <Screen
      title={messages.title}
      icon={IconListeningHistory}
      topbarRight={null}
      variant='secondary'
    >
      <ScreenContent>
        {showNoHistory ? (
          <EmptyTileCTA message={messages.noHistoryMessage} />
        ) : (
          <Paper m='l' gap='l' h='100%'>
            <FilterInput
              placeholder={messages.inputPlaceholder}
              onChangeText={handleChangeFilterValue}
              shadow='flat'
              mb={0}
              mh='s'
            />
            <TrackList
              uids={entries.map(({ uid }) => uid)}
              togglePlay={togglePlay}
              trackItemAction='overflow'
              onEndReached={loadNextPage}
              onEndReachedThreshold={0.5}
              showSkeleton={isPending}
              hasNextPage={hasNextPage}
              pageSize={pageSize}
            />
          </Paper>
        )}
        {showNoResults ? (
          <EmptyTile message={messages.noResultsMessage} />
        ) : null}
      </ScreenContent>
    </Screen>
  )
}
