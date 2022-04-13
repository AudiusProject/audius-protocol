import { useCallback, useEffect, useState } from 'react'

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
import { Notification } from 'audius-client/src/common/store/notifications/types'
import { isEqual } from 'lodash'
import { StyleSheet, View } from 'react-native'

import { FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useColor } from 'app/utils/theme'

import Empty from './Empty'
import NotificationBlock from './NotificationBlock'

const NOTIFICATION_PAGE_SIZE = 10

const styles = StyleSheet.create({
  list: {
    paddingTop: 2
  },
  itemContainer: {
    marginTop: 8,
    paddingHorizontal: 10
  },
  footer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48
  }
})

export const List = () => {
  const dispatchWeb = useDispatchWeb()

  const getNotifications = makeGetAllNotifications()
  const notifications = useSelectorWeb(getNotifications, isEqual)
  const status = useSelectorWeb(getNotificationStatus)
  const hasMore = useSelectorWeb(getNotificationHasMore)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onPullRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatchWeb(refreshNotifications())
  }, [dispatchWeb])

  useEffect(() => {
    if (status !== Status.LOADING) {
      setIsRefreshing(false)
    }
  }, [status, setIsRefreshing])

  const onEndReached = useCallback(() => {
    if (status !== Status.LOADING && hasMore) {
      dispatchWeb(fetchNotifications(NOTIFICATION_PAGE_SIZE))
    }
  }, [status, dispatchWeb, hasMore])

  const spinnerColor = useColor('neutralLight4')

  if (status === Status.SUCCESS && notifications.length === 0) {
    return <Empty />
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{
        paddingBottom: 80
      }}
      refreshing={isRefreshing}
      onRefresh={onPullRefresh}
      data={notifications}
      keyExtractor={(item: Notification) => `${item.id}`}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <NotificationBlock notification={item} />
        </View>
      )}
      ListFooterComponent={
        status === Status.LOADING && !isRefreshing ? (
          <View style={styles.footer}>
            <LoadingSpinner color={spinnerColor} />
          </View>
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
      initialNumToRender={10}
    />
  )
}
