import { useContext, useEffect } from 'react'

import {
  FEED_INITIAL_PAGE_SIZE,
  FEED_LOAD_MORE_PAGE_SIZE,
  useCurrentUserId,
  useFeed
} from '@audius/common/api'
import { Name, FeedFilter } from '@audius/common/models'
import { getUid } from '@audius/common/src/store/player/selectors'
import { feedPageLineupActions as feedActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/mobile/NavContext'
import { FeedPageContentProps } from 'pages/feed-page/types'
import { BASE_URL } from 'utils/route'

import Filters from './FeedFilterButton'
import FeedFilterDrawer from './FeedFilterDrawer'
import styles from './FeedPageContent.module.css'

const { FEED_PAGE } = route

const messages = {
  title: 'Your Feed'
}

const FeedPageMobileContent = ({
  feedTitle,
  feedDescription,
  feedFilter,
  setFeedFilter,
  scrollParentRef,
  resetFeedLineup
}: FeedPageContentProps) => {
  const playingUid = useSelector(getUid)
  const { setHeader } = useContext(HeaderContext)
  const [modalIsOpen, setModalIsOpen] = useModalState('FeedFilter')

  const { data: currentUserId } = useCurrentUserId()
  const lineupQueryData = useFeed({
    userId: currentUserId,
    filter: feedFilter,
    initialPageSize: FEED_INITIAL_PAGE_SIZE,
    loadMorePageSize: FEED_LOAD_MORE_PAGE_SIZE
  })

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
  }, [setHeader, feedFilter, setModalIsOpen])

  // Set Nav-Bar Menu
  useMainPageHeader()

  const record = useRecord()
  const handleSelectFilter = (filter: FeedFilter) => {
    setModalIsOpen(false)
    setFeedFilter(filter)
    resetFeedLineup()
    record(make(Name.FEED_CHANGE_VIEW, { view: filter }))
  }

  return (
    <MobilePageContainer
      title={feedTitle}
      description={feedDescription}
      canonicalUrl={`${BASE_URL}${FEED_PAGE}`}
      hasDefaultHeader
    >
      <FeedFilterDrawer
        isOpen={modalIsOpen}
        onSelectFilter={handleSelectFilter}
        onClose={() => setModalIsOpen(false)}
      />
      <div
        className={cn(styles.lineupContainer, {
          [styles.playing]: !!playingUid
        })}
      >
        <TanQueryLineup
          ordered
          scrollParent={scrollParentRef}
          actions={feedActions}
          delineate
          lineupQueryData={lineupQueryData}
          initialPageSize={FEED_INITIAL_PAGE_SIZE}
          pageSize={FEED_LOAD_MORE_PAGE_SIZE}
        />
      </div>
    </MobilePageContainer>
  )
}

export default FeedPageMobileContent
