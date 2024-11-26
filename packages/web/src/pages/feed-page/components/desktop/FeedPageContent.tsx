import { useFeatureFlag } from '@audius/common/hooks'
import { Name, FeedFilter } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { feedPageLineupActions as feedActions } from '@audius/common/store'
import { Text } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'
import Header from 'components/header/desktop/Header'
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
  const { isEnabled: isUSDCEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )

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
      primary={messages.feedHeaderTitle}
      variant='main'
      rightDecorator={
        <FeedFilters
          currentFilter={feedFilter}
          didSelectFilter={didSelectFilter}
        />
      }
    />
  )

  return (
    <Page
      title={feedTitle}
      description={feedDescription}
      size='large'
      header={header}
    >
      <Text color='staticWhite'>hello world</Text>
      <Lineup
        emptyElement={<EmptyFeed />}
        endOfLineup={<EndOfLineup key='endOfLineup' />}
        key='feed'
        showFeedTipTile={!isUSDCEnabled}
        {...feedLineupProps}
        {...mainLineupProps}
      />
    </Page>
  )
}

export default FeedPageContent
