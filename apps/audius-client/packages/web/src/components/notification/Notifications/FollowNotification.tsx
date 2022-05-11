import React, { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { ID } from 'common/models/Identifiers'
import { getUserId } from 'common/store/account/selectors'
import { Follow } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'
import {
  setUsers as setUserListUsers,
  setVisibility as openUserListModal
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { profilePage } from 'utils/route'

import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { UserNameLink } from './UserNameLink'
import { UserProfilePictureList } from './UserProfilePictureList'
import { IconFollow } from './icons'

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
  const { users, timeLabel, isRead } = notification
  const [firstUser, ...otherUsers] = users
  const otherUsersCount = otherUsers.length
  const isMultiUser = users.length > 1
  const dispatch = useDispatch()
  const accountId = useSelector(getUserId) as ID

  const handleClick = useCallback(() => {
    if (isMultiUser) {
      dispatch(
        setUserListUsers({
          userListType: UserListType.FOLLOWER,
          entityType: UserListEntityType.USER,
          id: accountId
        })
      )
      dispatch(openUserListModal(true))
    } else {
      dispatch(push(profilePage(firstUser.handle)))
    }
  }, [isMultiUser, dispatch, accountId, firstUser.handle])

  return (
    <NotificationTile
      notification={notification}
      onClick={handleClick}
      disableClosePanel={isMultiUser}
    >
      <NotificationHeader icon={<IconFollow />}>
        <UserProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={firstUser} notification={notification} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.followed}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
