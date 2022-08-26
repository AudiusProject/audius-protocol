import { useCallback, useEffect, useState } from 'react'

import {
  Name,
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors,
  modalsActions
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make, track } from 'app/services/analytics'
import { getIsSignedIn } from 'app/store/lifecycle/selectors'

import { FeedFilterButton } from './FeedFilterButton'
const { setVisibility } = modalsActions
const { getDiscoverFeedLineup, getFeedFilter } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed'
}

export const FeedScreen = () => {
  usePopToTopOnDrawerOpen()

  const dispatchWeb = useDispatchWeb()
  const dispatch = useDispatch()

  const feedLineup = useSelector(getFeedLineup)
  const signedIn = useSelector(getIsSignedIn)
  const feedFilter = useSelectorWeb(getFeedFilter)
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

  const handleFilterButtonPress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: 'FeedFilter', visible: true }))
  }, [dispatchWeb])

  return (
    <Screen>
      <Header text={messages.header}>
        <FeedFilterButton
          onPress={handleFilterButtonPress}
          currentFilter={feedFilter}
        />
      </Header>
      <Lineup
        actions={feedActions}
        delineate
        lineup={feedLineup}
        loadMore={loadMore}
        refresh={handleRefresh}
        refreshing={isRefreshing}
        selfLoad={!!signedIn}
        showsVerticalScrollIndicator={false}
        isFeed
      />
    </Screen>
  )
}
