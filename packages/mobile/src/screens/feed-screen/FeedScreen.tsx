import { useCallback } from 'react'

import {
  Name,
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageActions,
  feedPageSelectors
} from '@audius/common'
import type { FollowArtists } from 'audius-client/src/common/store/pages/signon/types'
import * as signOnActions from 'common/store/pages/signon/actions'
import { getFollowArtists } from 'common/store/pages/signon/selectors'
import { Dimensions } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconFeed from 'app/assets/images/iconFeed.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { SuggestedFollows } from 'app/components/suggested-follows'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import { make, track } from 'app/services/analytics'

import { FeedFilterButton } from './FeedFilterButton'
const { getDiscoverFeedLineup } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const { height } = Dimensions.get('window')

const messages = {
  header: 'Your Feed',
  emptyFeed: `Oops! There's nothing here.`
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

  const followArtists: FollowArtists = useSelector(getFollowArtists)
  const handleArtistsSelected = () => {
    // Set eager users and refetch lineup
    dispatch(signOnActions.followArtists(followArtists.selectedUserIds))
    dispatch(feedActions.fetchLineupMetadatas())
    // Async go follow users
    dispatch(feedPageActions.followUsers(followArtists.selectedUserIds))
  }

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconFeed}
        styles={{ icon: { marginLeft: 2 } }}
      >
        <OnlineOnly>
          <FeedFilterButton />
        </OnlineOnly>
      </ScreenHeader>
      <ScreenContent>
        <Lineup
          isFeed
          pullToRefresh
          delineate
          selfLoad
          LineupEmptyComponent={
            <SuggestedFollows
              style={{ height: height - 220 }}
              title={messages.emptyFeed}
              onArtistsSelected={handleArtistsSelected}
              screen='feed'
            />
          }
          actions={feedActions}
          lineupSelector={getFeedLineup}
          loadMore={loadMore}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>
    </Screen>
  )
}
