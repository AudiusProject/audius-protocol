import { useCallback } from 'react'

import { useFeed, useCurrentUserId } from '@audius/common/api'
import { Name } from '@audius/common/models'
import {
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors
} from '@audius/common/store'
import { useSelector } from 'react-redux'

import { IconFeed } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { EndOfLineupNotice } from 'app/components/lineup/EndOfLineupNotice'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { SuggestedFollows } from 'app/components/suggested-follows'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import { make, track } from 'app/services/analytics'

import { FeedFilterButton } from './FeedFilterButton'
const { getDiscoverFeedLineup, getFeedFilter } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed',
  endOfFeed: "Looks like you've reached the end of your feed..."
}

export const FeedScreen = () => {
  useAppTabScreen()

  const feedFilter = useSelector(getFeedFilter)
  const { data: currentUserId } = useCurrentUserId()
  const { lineup, loadNextPage } = useFeed({
    filter: feedFilter,
    userId: currentUserId
  })

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      loadNextPage()
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [loadNextPage]
  )

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
          lineup={lineup}
          pullToRefresh
          delineate
          selfLoad
          hideHeaderOnEmpty
          ListFooterComponent={
            <EndOfLineupNotice description={messages.endOfFeed} />
          }
          LineupEmptyComponent={<SuggestedFollows />}
          actions={feedActions}
          lineupSelector={getFeedLineup}
          loadMore={loadMore}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>
    </Screen>
  )
}
