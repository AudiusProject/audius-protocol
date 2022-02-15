import { useCallback, useEffect, useState } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Name } from 'audius-client/src/common/models/Analytics'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { feedActions } from 'audius-client/src/common/store/pages/feed/lineup/actions'
import {
  getDiscoverFeedLineup,
  getFeedFilter
} from 'audius-client/src/common/store/pages/feed/selectors'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { isEqual } from 'lodash'

import { FeedStackParamList } from 'app/components/app-navigator/types'
import { Lineup } from 'app/components/lineup'
import { ScreenHeader } from 'app/components/screen-header'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make, track } from 'app/utils/analytics'

import { FeedFilterButton } from './FeedFilterButton'

type Props = NativeStackScreenProps<FeedStackParamList, 'feed-stack'>

const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

const messages = {
  header: 'Your Feed'
}

export const FeedScreen = ({ navigation }: Props) => {
  const dispatchWeb = useDispatchWeb()
  const feedLineup = useSelectorWeb(getFeedLineup, isEqual)
  const feedFilter = useSelectorWeb(getFeedFilter)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadMore = (offset: number, limit: number, overwrite: boolean) => {
    dispatchWeb(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
    track(make({ eventName: Name.FEED_PAGINATE, offset, limit }))
  }

  useEffect(() => {
    if (!feedLineup.isMetadataLoading) {
      setIsRefreshing(false)
    }
  }, [feedLineup])

  const refresh = () => {
    setIsRefreshing(true)
    dispatchWeb(feedActions.refreshInView(true))
  }

  const playTrack = (uid?: string) => {
    dispatchWeb(feedActions.play(uid))
  }

  const pauseTrack = () => {
    dispatchWeb(feedActions.pause())
  }

  const handleFilterButtonPress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: 'FeedFilter', visible: true }))
  }, [dispatchWeb])

  return (
    <>
      <ScreenHeader text={messages.header}>
        <FeedFilterButton
          onPress={handleFilterButtonPress}
          currentFilter={feedFilter}
        />
      </ScreenHeader>
      <Lineup
        actions={feedActions}
        delineate
        lineup={feedLineup}
        loadMore={loadMore}
        refresh={refresh}
        refreshing={isRefreshing && feedLineup.isMetadataLoading}
        pauseTrack={pauseTrack}
        playTrack={playTrack}
        selfLoad
      />
    </>
  )
}
