import { useCallback } from 'react'

import { getNotificationUsers } from 'audius-client/src/common/store/notifications/selectors'
import { setNotificationId } from 'audius-client/src/common/store/user-list/notifications/actions'
import { Follow } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'
import { push } from 'connected-react-router'
import { isEqual } from 'lodash'
import { NOTIFICATION_PAGE, profilePage } from 'utils/route'

import IconUser from 'app/assets/images/iconUser.svg'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getUserRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationTile,
  ProfilePictureList,
  UserNameLink
} from '../Notification'
import { NotificationText } from '../Notification/NotificationText'
import { getUserListRoute } from '../routeUtil'
import { useDrawerNavigation } from '../useDrawerNavigation'

const USER_LENGTH_LIMIT = 8

const messages = {
  others: (userCount: number) =>
    ` and ${formatCount(userCount)} other${userCount > 1 ? 's' : ''}`,
  followed: ' followed you'
}

type FollowNotificationProps = {
  notification: Follow
}

export const FollowNotification = (props: FollowNotificationProps) => {
  const { notification } = props
  const { id, userIds, type } = notification
  const users = useSelectorWeb(
    state => getNotificationUsers(state, notification, USER_LENGTH_LIMIT),
    isEqual
  )
  const [firstUser] = users ?? []
  const otherUsersCount = userIds.length - 1
  const isMultiUser = userIds.length > 1
  const dispatchWeb = useDispatchWeb()
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
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
      dispatchWeb(push(profilePage(firstUser.handle)))
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

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconUser}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.followed}
      </NotificationText>
    </NotificationTile>
  )
}
