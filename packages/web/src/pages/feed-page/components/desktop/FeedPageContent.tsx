import {
  FEED_LOAD_MORE_PAGE_SIZE,
  FEED_INITIAL_PAGE_SIZE,
  useCurrentUserId,
  useFeed
} from '@audius/common/api'
import { Name, FeedFilter } from '@audius/common/models'
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

const FeedPageContent = ({
  feedTitle,
  feedDescription,
  feedIsMain,
  feedFilter,
  setFeedFilter,
  resetFeedLineup
}: FeedPageContentProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const {
    data,
    isFetching,
    isPending,
    isError,
    hasNextPage,
    loadNextPage,
    isPlaying,
    play,
    pause,
    lineup
  } = useFeed({
    userId: currentUserId,
    filter: feedFilter,
    initialPageSize: FEED_INITIAL_PAGE_SIZE,
    loadMorePageSize: FEED_LOAD_MORE_PAGE_SIZE
  })

  const record = useRecord()

  const didSelectFilter = (filter: FeedFilter) => {
    // TODO: scroll to top of feed
    // if (scrollParentRef && scrollParentRef.scrollTo) {
    //   scrollParentRef.scrollTo(0, 0)
    // }
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
        data={data}
        isFetching={isFetching}
        isPending={isPending}
        isError={isError}
        hasNextPage={hasNextPage}
        loadNextPage={loadNextPage}
        play={play}
        pause={pause}
        isPlaying={isPlaying}
        lineup={lineup}
        initialPageSize={FEED_INITIAL_PAGE_SIZE}
        pageSize={FEED_LOAD_MORE_PAGE_SIZE}
        emptyElement={<EmptyFeed />}
        endOfLineupElement={<EndOfLineup />}
        delineate={feedIsMain}
        actions={feedActions}
        variant={LineupVariant.MAIN}
      />
    </Page>
  )
}

export default FeedPageContent
