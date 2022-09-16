import { useCallback, useContext, useEffect, useState } from 'react'

import type { Notification } from '@audius/common'
import {
  useProxySelector,
  Status,
  notificationsSelectors,
  notificationsActions
} from '@audius/common'
import type { ViewToken } from 'react-native'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { EmptyNotifications } from './EmptyNotifications'
import { NotificationListItem } from './NotificationListItem'
import { NotificationsDrawerNavigationContext } from './NotificationsDrawerNavigationContext'
const { fetchNotifications, refreshNotifications } = notificationsActions
const {
  getNotificationHasMore,
  getNotificationStatus,
  makeGetAllNotifications
} = notificationsSelectors

const NOTIFICATION_PAGE_SIZE = 10

const useStyles = makeStyles(({ spacing, palette }) => ({
  container: {
    paddingBottom: spacing(30)
  },
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

/**
 * Hook to handle tracking visibility for notification items, by index.
 * Returns a function to check the visibility for an index, and a callback for the Flatlist.
 */
const useIsViewable = () => {
  const [viewableMap, setViewableMap] = useState<{ [index: number]: boolean }>(
    {}
  )

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setViewableMap((viewableMap) => {
        // First check length
        let didChange =
          viewableItems.length !== Object.values(viewableMap).length
        // If lengths same, check each element
        if (!didChange) {
          for (const viewable of viewableItems) {
            if (viewable.index !== null && !viewableMap[viewable.index]) {
              didChange = true
              break
            }
          }
        }
        // If no change, return same item to prevent re-render
        if (!didChange) {
          return viewableMap
        }

        // Reconstruct the viewableMap from the viewableItems
        return viewableItems.reduce((acc, cur) => {
          if (cur.index === null) return acc
          return {
            ...acc,
            [cur.index]: true
          }
        }, {})
      })
    },
    []
  )

  return [
    (index: number) => viewableMap[index] !== undefined,
    onViewableItemsChanged
  ] as [(index: number) => boolean, typeof onViewableItemsChanged]
}

export const NotificationList = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const notifications = useProxySelector(getNotifications, [])
  const status = useSelector(getNotificationStatus)
  const hasMore = useSelector(getNotificationHasMore)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { gesturesDisabled } = useContext(NotificationsDrawerNavigationContext)

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    dispatch(refreshNotifications())
  }, [dispatch])

  useEffect(() => {
    if (status !== Status.LOADING) {
      setIsRefreshing(false)
    }
  }, [status, setIsRefreshing])

  const handleEndReached = useCallback(() => {
    if (status !== Status.LOADING && hasMore) {
      dispatch(fetchNotifications(NOTIFICATION_PAGE_SIZE))
    }
  }, [status, dispatch, hasMore])

  const [isVisible, visibilityCallback] = useIsViewable()

  if (status === Status.SUCCESS && notifications.length === 0) {
    return <EmptyNotifications />
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      style={styles.list}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      data={notifications}
      keyExtractor={(item: Notification, index) => `${item.id} ${index}`}
      renderItem={({ item, index }) => (
        <NotificationListItem
          notification={item}
          isVisible={isVisible(index)}
        />
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
      onViewableItemsChanged={visibilityCallback}
    />
  )
}
