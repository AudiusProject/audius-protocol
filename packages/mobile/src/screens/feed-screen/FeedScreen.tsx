import { useCallback, useEffect, useState } from 'react'

import { Name } from '@audius/common'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { feedActions } from 'audius-client/src/common/store/pages/feed/lineup/actions'
import {
  getDiscoverFeedLineup,
  getFeedFilter
} from 'audius-client/src/common/store/pages/feed/selectors'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { omit } from 'lodash'
import { useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'
import { getIsSignedIn } from 'app/store/lifecycle/selectors'
import { make, track } from 'app/utils/analytics'

import { FeedFilterButton } from './FeedFilterButton'

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed'
}

export const FeedScreen = () => {
  usePopToTopOnDrawerOpen()

  const dispatchWeb = useDispatchWeb()
  const feedLineup = useSelectorWeb(getFeedLineup, (a, b) => {
    const omitUneeded = <T extends object>(o: T) => omit(o, ['inView'])
    return isEqual(omitUneeded(a), omitUneeded(b))
  })
  const signedIn = useSelector(getIsSignedIn)
  const feedFilter = useSelectorWeb(getFeedFilter)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatchWeb(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
      track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
    },
    [dispatchWeb]
  )

  useEffect(() => {
    if (!feedLineup.isMetadataLoading) {
      setIsRefreshing(false)
    }
  }, [feedLineup.isMetadataLoading])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatchWeb(feedActions.refreshInView(true))
  }, [dispatchWeb])

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
