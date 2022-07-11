import { useCallback } from 'react'

import { User } from 'audius-client/src/common/models/User'
import {
  Favorite,
  Follow,
  Repost
} from 'audius-client/src/common/store/notifications/types'
import { setNotificationId } from 'audius-client/src/common/store/user-list/notifications/actions'
import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { getUserRoute } from 'app/utils/routes'

import { getUserListRoute } from '../routeUtil'
import { useDrawerNavigation } from '../useDrawerNavigation'

/**
 * onPress handler for social notifications that opens user-lists when notification
 * has multiple users, and opens user profile when just one.
 */
export const useSocialActionHandler = (
  notification: Follow | Repost | Favorite,
  users: User[]
) => {
  const { id, type, userIds } = notification
  const [firstUser] = users
  const isMultiUser = userIds.length > 1
  const dispatchWeb = useDispatchWeb()
  const navigation = useDrawerNavigation()

  return useCallback(() => {
    if (isMultiUser) {
      dispatchWeb(setNotificationId(id))
      navigation.navigate({
        native: {
          screen: 'NotificationUsers',
          params: {
            id,
            notificationType: type,
            count: userIds.length,
            fromNotifications: true
          }
        },
        web: {
          route: getUserListRoute(notification),
          fromPage: NOTIFICATION_PAGE
        }
      })
    } else {
      navigation.navigate({
        native: {
          screen: 'Profile',
          params: { handle: firstUser.handle, fromNotifications: true }
        },
        web: { route: getUserRoute(firstUser), fromPage: NOTIFICATION_PAGE }
      })
    }
  }, [
    isMultiUser,
    id,
    type,
    userIds,
    notification,
    dispatchWeb,
    navigation,
    firstUser
  ])
}
