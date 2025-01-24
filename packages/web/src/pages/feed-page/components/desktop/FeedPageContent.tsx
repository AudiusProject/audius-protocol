import { useFeed } from '@audius/common/api'
import { Name, FeedFilter } from '@audius/common/models'
import { useCurrentUserId } from '@audius/common/src/api/tan-query/useCurrentUserId'
import { feedPageLineupActions as feedActions } from '@audius/common/store'
import { IconFeed } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'
import { Header } from 'components/header/desktop/Header'
import EndOfLineup from 'components/lineup/EndOfLineup'
import {
  getLoadMoreTrackCount,
  INITIAL_LOAD_TRACKS_MULTIPLIER
} from 'components/lineup/LineupProvider'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
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
  setFeedInView,
  loadMoreFeed,
  getLineupProps,
  feedFilter,
  setFeedFilter,
  resetFeedLineup
}: FeedPageContentProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const lineupQueryData = useFeed({
    userId: currentUserId
  })

  const lineupProps = getLineupProps(lineupQueryData.lineup)
  const scrollParent = lineupProps.scrollParent
  const record = useRecord()

  const didSelectFilter = (filter: FeedFilter) => {
    if (scrollParent && scrollParent.scrollTo) {
      scrollParent.scrollTo(0, 0)
    }
    setFeedFilter(filter)
    resetFeedLineup()
    const fetchLimit = getLoadMoreTrackCount(
      LineupVariant.MAIN,
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

  return (
    <Page
      title={feedTitle}
      description={feedDescription}
      size='large'
      header={header}
    >
      <TanQueryLineup
        {...lineupProps}
        lineupQueryData={lineupQueryData}
        initialPageSize={10}
        pageSize={4}
        emptyElement={<EmptyFeed />}
        endOfLineup={<EndOfLineup />}
        setInView={setFeedInView}
        delineate={feedIsMain}
        actions={feedActions}
        variant={LineupVariant.MAIN}
      />
    </Page>
  )
}

export default FeedPageContent
