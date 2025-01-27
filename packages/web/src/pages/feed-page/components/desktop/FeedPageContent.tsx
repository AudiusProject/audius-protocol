import { useFeed } from '@audius/common/api'
import { Name, FeedFilter } from '@audius/common/models'
import { useCurrentUserId } from '@audius/common/src/api/tan-query/useCurrentUserId'
import { feedPageLineupActions as feedActions } from '@audius/common/store'
import { IconFeed } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'
import { Header } from 'components/header/desktop/Header'
import EndOfLineup from 'components/lineup/EndOfLineup'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { LineupVariant } from 'components/lineup/types'
import Page from 'components/page/Page'
import EmptyFeed from 'pages/feed-page/components/EmptyFeed'
import { FeedPageContentProps } from 'pages/feed-page/types'

import { FeedFilters } from './FeedFilters'

const messages = {
  feedHeaderTitle: 'Your Feed'
}

const INITIAL_PAGE_SIZE = 10
const ADDITIONAL_PAGE_SIZE = 4

const FeedPageContent = ({
  feedTitle,
  feedDescription,
  feedIsMain,
  setFeedInView,
  getLineupProps,
  feedFilter,
  setFeedFilter,
  resetFeedLineup
}: FeedPageContentProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const lineupQueryData = useFeed({
    userId: currentUserId,
    filter: feedFilter,
    initialPageSize: INITIAL_PAGE_SIZE,
    loadMorePageSize: ADDITIONAL_PAGE_SIZE
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
        initialPageSize={INITIAL_PAGE_SIZE}
        pageSize={ADDITIONAL_PAGE_SIZE}
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
