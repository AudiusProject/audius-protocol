import { useCallback } from 'react'

import { useCurrentUserId, useFeed } from '@audius/common/api'
import {
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors
} from '@audius/common/store'

import { IconFeed } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { EndOfLineupNotice } from 'app/components/lineup/EndOfLineupNotice'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'

import { FeedFilterButton } from './FeedFilterButton'
const { getDiscoverFeedLineup } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed',
  endOfFeed: "Looks like you've reached the end of your feed..."
}

export const FeedScreen = () => {
  useAppTabScreen()
  const { data: currentUserId } = useCurrentUserId()

  const { fetchNextPage, lineup, refetch, isFetching } = useFeed({
    userId: currentUserId
  })
  const loadMore = useCallback(() => {
    if (!isFetching) {
      fetchNextPage()
    }
  }, [fetchNextPage, isFetching])

  return (
    <Screen url='Feed'>
      <ScreenHeader text={messages.header} icon={IconFeed}>
        <OnlineOnly>
          <FeedFilterButton />
        </OnlineOnly>
      </ScreenHeader>
      <ScreenContent>
        <Lineup
          tanQuery
          pullToRefresh
          delineate
          selfLoad
          hideHeaderOnEmpty
          ListFooterComponent={
            <EndOfLineupNotice description={messages.endOfFeed} />
          }
          refresh={() => {
            refetch()
          }}
          lineup={lineup}
          actions={feedActions}
          lineupSelector={getFeedLineup}
          loadMore={loadMore}
          initialPageSize={10}
          pageSize={4}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>
    </Screen>
  )
}
