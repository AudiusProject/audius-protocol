import { Name, FeedFilter } from '@audius/common/models'
import { useUserByHandle } from '@audius/common/src/api/tan-query/useUserByHandle'
import { useUsers } from '@audius/common/src/api/tan-query/useUsers'
import { feedPageLineupActions as feedActions } from '@audius/common/store'
import { IconFeed } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'
import { Header } from 'components/header/desktop/Header'
import EndOfLineup from 'components/lineup/EndOfLineup'
import Lineup from 'components/lineup/Lineup'
import {
  getLoadMoreTrackCount,
  INITIAL_LOAD_TRACKS_MULTIPLIER
} from 'components/lineup/LineupProvider'
import { LineupVariant } from 'components/lineup/types'
import Page from 'components/page/Page'
import EmptyFeed from 'pages/feed-page/components/EmptyFeed'
import { FeedPageContentProps } from 'pages/feed-page/types'

import { FeedFilters } from './FeedFilters'

const messages = {
  feedHeaderTitle: 'Your Feed'
}

const FeedPageContent = ({
  feedTitle,
  feedDescription,
  feedIsMain,
  feed,
  setFeedInView,
  loadMoreFeed,
  playFeedTrack,
  pauseFeedTrack,
  getLineupProps,
  feedFilter,
  setFeedFilter,
  resetFeedLineup
}: FeedPageContentProps) => {
  const mainLineupProps = {
    variant: LineupVariant.MAIN
  }

  const feedLineupProps = {
    ...getLineupProps(feed),
    setInView: setFeedInView,
    loadMore: loadMoreFeed,
    playTrack: playFeedTrack,
    pauseTrack: pauseFeedTrack,
    delineate: feedIsMain,
    actions: feedActions
  }
  const record = useRecord()

  const didSelectFilter = (filter: FeedFilter) => {
    if (feedLineupProps.scrollParent && feedLineupProps.scrollParent.scrollTo) {
      feedLineupProps.scrollParent.scrollTo(0, 0)
    }
    setFeedFilter(filter)
    resetFeedLineup()
    const fetchLimit = getLoadMoreTrackCount(
      mainLineupProps.variant,
      INITIAL_LOAD_TRACKS_MULTIPLIER
    )
    const fetchOffset = 0
    loadMoreFeed(fetchOffset, fetchLimit, true)
    record(make(Name.FEED_CHANGE_VIEW, { view: filter }))
  }

  const header = (
    <Header
      icon={IconFeed}
      primary={messages.feedHeaderTitle}
      rightDecorator={
        <FeedFilters
          currentFilter={feedFilter}
          didSelectFilter={didSelectFilter}
        />
      }
    />
  )

  // Debugging
  const { data: users, isLoading } = useUsers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  return (
    <Page
      title={feedTitle}
      description={feedDescription}
      size='large'
      header={header}
    >
      <div>
        {isLoading && <div>Loading...</div>}
        {users?.map((user) => <div key={user.user_id}>{user.name}</div>)}
      </div>
      <Lineup
        emptyElement={<EmptyFeed />}
        endOfLineup={<EndOfLineup />}
        {...feedLineupProps}
        {...mainLineupProps}
      />
    </Page>
  )
}

export default FeedPageContent
