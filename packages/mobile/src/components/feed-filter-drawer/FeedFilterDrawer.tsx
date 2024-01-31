import { useCallback, useMemo } from 'react'

import { Name, FeedFilter } from '@audius/common/models'
import {
  feedPageLineupActions as feedActions,
  feedPageActions
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import ActionDrawer from 'app/components/action-drawer'
import { Text } from 'app/components/core'
import { make, track } from 'app/services/analytics'

const { setFeedFilter } = feedPageActions

const MODAL_NAME = 'FeedFilter'

export const messages = {
  title: 'What do you want to see in your feed?',
  filterAll: 'All Posts',
  filterOriginal: 'Original Posts',
  filterReposts: 'Reposts'
}

export const FeedFilterDrawer = () => {
  const dispatch = useDispatch()

  const handleSelectFilter = useCallback(
    (filter: FeedFilter) => {
      dispatch(setFeedFilter(filter))
      // Clear the lineup
      dispatch(feedActions.reset())
      // Tell the store that the feed is still in view so it can be refetched
      dispatch(feedActions.setInView(true))
      // Force a refresh for at least 10 tiles
      dispatch(feedActions.refreshInView(true, null, 10))
      track(make({ eventName: Name.FEED_CHANGE_VIEW, view: filter }))
    },
    [dispatch]
  )

  const rows = useMemo(
    () => [
      {
        text: messages.filterAll,
        callback: () => handleSelectFilter(FeedFilter.ALL)
      },
      {
        text: messages.filterOriginal,
        callback: () => handleSelectFilter(FeedFilter.ORIGINAL)
      },
      {
        text: messages.filterReposts,
        callback: () => handleSelectFilter(FeedFilter.REPOST)
      }
    ],
    [handleSelectFilter]
  )

  return (
    <ActionDrawer
      modalName={MODAL_NAME}
      title={
        <Text color='neutral' textTransform='none'>
          {messages.title}
        </Text>
      }
      rows={rows}
    />
  )
}
