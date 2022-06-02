import { useCallback, useContext, useEffect, useState } from 'react'

import Status from 'audius-client/src/common/models/Status'
import {
  fetchNotifications,
  refreshNotifications
} from 'audius-client/src/common/store/notifications/actions'
import {
  getNotificationHasMore,
  getNotificationStatus,
  makeGetAllNotifications
} from 'audius-client/src/common/store/notifications/selectors'
import {
  Notification,
  NotificationType
} from 'audius-client/src/common/store/notifications/types'
import { View } from 'react-native'

import { FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { EmptyNotifications } from './EmptyNotifications'
import { NotificationListItem } from './NotificationListItem'
import { NotificationsDrawerNavigationContext } from './NotificationsDrawerNavigationContext'

const NOTIFICATION_PAGE_SIZE = 10

const useStyles = makeStyles(({ spacing, palette }) => ({
  list: {
    paddingTop: spacing(1)
  },
  itemContainer: {
    marginTop: spacing(2),
    paddingHorizontal: spacing(2)
  },
  footer: {
    marginTop: spacing(5),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing(12)
  },
  spinner: {
    color: palette.neutralLight4
  }
}))

const getNotifications = makeGetAllNotifications()

export const NotificationList = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const notificationss = useSelectorWeb(getNotifications, isEqual)
  const status = useSelectorWeb(getNotificationStatus)
  const hasMore = useSelectorWeb(getNotificationHasMore)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { gesturesDisabled } = useContext(NotificationsDrawerNavigationContext)

  const notifications = [
    {
      type: NotificationType.TipSent,
      reaction: 'party',
      value: 1000,
      userId: 1077098,
      id: 'blah blahh',
      isViewed: false
    },
    {
      type: NotificationType.TipReaction,
      reaction: 'party',
      value: 1000,
      userId: 1077098,
      id: 'blah blah',
      isViewed: false
    },
    {
      type: NotificationType.TipReceived,
      value: 1000,
      userId: 1077098,
      id: 'blah blahhh',
      isViewed: false
    },
    ...notificationss
  ]

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatchWeb(refreshNotifications())
  }, [dispatchWeb])

  useEffect(() => {
    if (status !== Status.LOADING) {
      setIsRefreshing(false)
    }
  }, [status, setIsRefreshing])

  const handleEndReached = useCallback(() => {
    if (status !== Status.LOADING && hasMore) {
      dispatchWeb(fetchNotifications(NOTIFICATION_PAGE_SIZE))
    }
  }, [status, dispatchWeb, hasMore])

  if (status === Status.SUCCESS && notifications.length === 0) {
    return <EmptyNotifications />
  }

  return (
    <FlatList
      style={styles.list}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      data={notifications}
      keyExtractor={(item: Notification, index) => `${item.id} ${index}`}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <NotificationListItem notification={item} />
        </View>
      )}
      ListFooterComponent={
        status === Status.LOADING && !isRefreshing ? (
          <View style={styles.footer}>
            <LoadingSpinner fill={styles.spinner.color} />
          </View>
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.8}
      initialNumToRender={10}
      scrollEnabled={!gesturesDisabled}
    />
  )
}
