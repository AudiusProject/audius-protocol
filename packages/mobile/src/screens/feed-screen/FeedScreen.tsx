import { useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { IconFeed } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { FeedTipTile } from 'app/components/feed-tip-tile'
import { Lineup } from 'app/components/lineup'
import { EndOfLineupNotice } from 'app/components/lineup/EndOfLineupNotice'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import { make, track } from 'app/services/analytics'

import { HeaderLeftProfile } from '../app-screen/useAppScreenOptions'

import { EmptyFeedSuggestedFollows } from './EmptyFeedSuggestedFollows'
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
  const { isEnabled: isUsdcEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )

  const dispatch = useDispatch()

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [dispatch]
  )

  return (
    <Screen url='Feed' topbarLeft={<HeaderLeftProfile />}>
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
          header={isUsdcEnabled ? null : <FeedTipTile />}
          hideHeaderOnEmpty
          ListFooterComponent={
            <EndOfLineupNotice description={messages.endOfFeed} />
          }
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
