import { useCallback, useMemo } from 'react'

import { FeedFilter, Name } from '@audius/common'
import { setFeedFilter } from 'audius-client/src/common/store/pages/feed/actions'
import { feedActions } from 'audius-client/src/common/store/pages/feed/lineup/actions'
import { Text } from 'react-native'

import ActionDrawer from 'app/components/action-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'

const MODAL_NAME = 'FeedFilter'

export const messages = {
  title: 'What do you want to see in your feed?',
  filterAll: 'All Posts',
  filterOriginal: 'Original Posts',
  filterReposts: 'Reposts'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  title: {
    ...typography.body,
    color: palette.neutral,
    textAlign: 'center',
    marginTop: spacing(2),
    marginBottom: spacing(4)
  }
}))

export const FeedFilterDrawer = () => {
  const dispatchWeb = useDispatchWeb()

  const styles = useStyles()

  const handleSelectFilter = useCallback(
    (filter: FeedFilter) => {
      dispatchWeb(setFeedFilter(filter))
      // Clear the lineup
      dispatchWeb(feedActions.reset())
      // Tell the store that the feed is still in view so it can be refetched
      dispatchWeb(feedActions.setInView(true))
      // Force a refresh for at least 10 tiles
      dispatchWeb(feedActions.refreshInView(true, 10))
      track(make({ eventName: Name.FEED_CHANGE_VIEW, view: filter }))
    },
    [dispatchWeb]
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
      renderTitle={() => <Text style={styles.title}>{messages.title}</Text>}
      rows={rows}
    />
  )
}
