import { useCallback } from 'react'

import type {
  User,
  Nullable,
  FavoriteNotification,
  FollowNotification,
  RepostNotification
} from '@audius/common'
import { notificationsUserListActions } from '@audius/common'
import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { getUserRoute } from 'app/utils/routes'

import { useDrawerNavigation } from '../useDrawerNavigation'
const { setNotificationId } = notificationsUserListActions

/**
 * onPress handler for social notifications that opens user-lists when notification
 * has multiple users, and opens user profile when just one.
 */
export const useSocialActionHandler = (
  notification: FollowNotification | RepostNotification | FavoriteNotification,
  users: Nullable<User[]>
) => {
  const { id, type, userIds } = notification
  const firstUser = users?.[0]
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
          route: `/notification/${id}/users`,
          fromPage: NOTIFICATION_PAGE
        }
      })
    } else if (firstUser) {
      navigation.navigate({
        native: {
          screen: 'Profile',
          params: { handle: firstUser.handle, fromNotifications: true }
        },
        web: { route: getUserRoute(firstUser), fromPage: NOTIFICATION_PAGE }
      })
    }
  }, [isMultiUser, id, type, userIds, dispatchWeb, navigation, firstUser])
}
