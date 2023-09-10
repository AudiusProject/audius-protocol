import { useCallback } from 'react'

import {
  Name,
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors
} from '@audius/common'
import { useDispatch } from 'react-redux'

import IconFeed from 'app/assets/images/iconFeed.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { FeedTipTile } from 'app/components/feed-tip-tile'
import { Lineup } from 'app/components/lineup'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import { make, track } from 'app/services/analytics'

import { EmptyFeedSuggestedFollows } from './EmptyFeedSuggestedFollows'
import { EndOfFeedNotice } from './EndOfFeedNotice'
import { FeedFilterButton } from './FeedFilterButton'
const { getDiscoverFeedLineup } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed'
}

export const FeedScreen = () => {
  useAppTabScreen()

  const dispatch = useDispatch()

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [dispatch]
  )

  return (
    <Screen>
      <ScreenHeader text={messages.header} icon={IconFeed}>
        <OnlineOnly>
          <FeedFilterButton />
        </OnlineOnly>
      </ScreenHeader>
      <ScreenContent>
        <Lineup
          pullToRefresh
          delineate
          selfLoad
          header={<FeedTipTile />}
          hideHeaderOnEmpty
          ListFooterComponent={<EndOfFeedNotice />}
          LineupEmptyComponent={<EmptyFeedSuggestedFollows />}
          actions={feedActions}
          lineupSelector={getFeedLineup}
          loadMore={loadMore}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>
    </Screen>
  )
}
