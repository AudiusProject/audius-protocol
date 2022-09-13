import { useCallback, useEffect, useState } from 'react'

import {
  Name,
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { make, track } from 'app/services/analytics'

import { FeedFilterButton } from './FeedFilterButton'
const { getDiscoverFeedLineup } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed'
}

export const FeedScreen = () => {
  usePopToTopOnDrawerOpen()

  const dispatch = useDispatch()

  const feedLineup = useSelector(getFeedLineup)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [dispatch]
  )

  useEffect(() => {
    if (!feedLineup.isMetadataLoading) {
      setIsRefreshing(false)
    }
  }, [feedLineup.isMetadataLoading])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatch(feedActions.refreshInView(true))
  }, [dispatch])

  return (
    <Screen>
      <Header text={messages.header}>
        <FeedFilterButton />
      </Header>
      <Lineup
        actions={feedActions}
        delineate
        lineup={feedLineup}
        loadMore={loadMore}
        refresh={handleRefresh}
        refreshing={isRefreshing}
        selfLoad
        showsVerticalScrollIndicator={false}
        isFeed
      />
    </Screen>
  )
}
