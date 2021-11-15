import React, { useState, useContext, useEffect, useCallback } from 'react'

import cn from 'classnames'

import { Name } from 'common/models/Analytics'
import FeedFilter from 'common/models/FeedFilter'
import Status from 'common/models/Status'
import MobilePageContainer from 'components/general/MobilePageContainer'
import Header from 'components/general/header/mobile/Header'
import { HeaderContext } from 'components/general/header/mobile/HeaderContextProvider'
import PullToRefresh from 'components/pull-to-refresh/PullToRefresh'
import { feedActions } from 'containers/feed-page/store/lineups/feed/actions'
import { FeedPageContentProps } from 'containers/feed-page/types'
import Lineup from 'containers/lineup/Lineup'
import { useMainPageHeader } from 'containers/nav/store/context'
import useAsyncPoll from 'hooks/useAsyncPoll'
import { make, useRecord } from 'store/analytics/actions'
import { BASE_URL, FEED_PAGE } from 'utils/route'

import Filters from './FeedFilterButton'
import FeedFilterModal from './FeedFilterModal'
import styles from './FeedPageContent.module.css'

const filters = [FeedFilter.ALL, FeedFilter.ORIGINAL, FeedFilter.REPOST]

const messages = {
  title: 'Your Feed'
}

const FeedPageMobileContent = ({
  feedTitle,
  feedDescription,
  feed,
  setFeedInView,
  loadMoreFeed,
  playFeedTrack,
  pauseFeedTrack,
  getLineupProps,
  feedFilter,
  setFeedFilter,
  refreshFeedInView,
  resetFeedLineup
}: FeedPageContentProps) => {
  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <Header title={messages.title} className={styles.header}>
        <Filters
          currentFilter={feedFilter}
          didOpenModal={() => {
            setModalIsOpen(true)
          }}
          showIcon={false}
        />
      </Header>
    )
  }, [setHeader, feedFilter])

  // Set Nav-Bar Menu
  useMainPageHeader()

  const lineupProps = {
    ordered: true,
    ...getLineupProps(feed),
    loadMore: (offset: number, limit: number, overwrite: boolean) =>
      loadMoreFeed(offset, limit, overwrite),
    setInView: setFeedInView,
    playTrack: playFeedTrack,
    pauseTrack: pauseFeedTrack,
    actions: feedActions,
    delineate: true
  }

  const [modalIsOpen, setModalIsOpen] = useState(false)
  const record = useRecord()
  const selectFilter = (filter: FeedFilter) => {
    setModalIsOpen(false)
    setFeedFilter(filter)
    // Clear the lineup
    resetFeedLineup()
    // Tell the store that the feed is still in view so it can be refetched
    setFeedInView(true)
    // Force a refresh for at least 10 tiles
    refreshFeedInView(true, 10)
    record(make(Name.FEED_CHANGE_VIEW, { view: filter }))
  }

  const refresh = useCallback(() => refreshFeedInView(true), [
    refreshFeedInView
  ])
  const asyncRefresh = useAsyncPoll({
    call: refresh,
    variable: feed.status,
    value: Status.SUCCESS
  })

  return (
    <MobilePageContainer
      title={feedTitle}
      description={feedDescription}
      canonicalUrl={`${BASE_URL}${FEED_PAGE}`}
      hasDefaultHeader
    >
      <FeedFilterModal
        filters={filters}
        isOpen={modalIsOpen}
        didSelectFilter={selectFilter}
        onClose={() => setModalIsOpen(false)}
      />
      <div
        className={cn(styles.lineupContainer, {
          [styles.playing]: !!lineupProps.playingUid
        })}
      >
        <PullToRefresh fetchContent={asyncRefresh}>
          <Lineup {...lineupProps} />
        </PullToRefresh>
      </div>
    </MobilePageContainer>
  )
}

export default FeedPageMobileContent
