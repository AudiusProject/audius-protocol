import { MouseEventHandler, useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { Name } from '@audius/common/models'
import {
  notificationsSelectors,
  CommentThreadNotification as CommentThreadNotificationType
} from '@audius/common/store'
import { IconMessage } from '@audius/harmony'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'
import { make, track } from 'services/analytics'
import {
  setUsers as setUserListUsers,
  setVisibility as openUserListModal
} from 'store/application/ui/userListModal/slice'
import { UserListType } from 'store/application/ui/userListModal/types'
import { useSelector } from 'utils/reducer'

import { EntityLink, useGoToEntity } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { OthersLink } from './components/OthersLink'
import { UserNameLink } from './components/UserNameLink'
import { UserProfilePictureList } from './components/UserProfilePictureList'
import { entityToUserListEntity, USER_LENGTH_LIMIT } from './utils'
const { getNotificationEntity, getNotificationUsers } = notificationsSelectors

const messages = {
  replied: ' replied to your comment on',
  your: 'your',
  their: 'their'
}

type CommentThreadNotificationProps = {
  notification: CommentThreadNotificationType
}

export const CommentThreadNotification = (
  props: CommentThreadNotificationProps
) => {
  const { notification } = props
  const { id, userIds, entityType, timeLabel, isViewed } = notification
  const users = useSelector((state) =>
    getNotificationUsers(state, notification, USER_LENGTH_LIMIT)
  )
  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1
  const isMultiUser = userIds.length > 1

  const entity = useSelector((state) =>
    getNotificationEntity(state, notification)
  )

  const { data: currentUserId } = useGetCurrentUserId({})
  const isOwner = entity?.user?.user_id === currentUserId
  const isOwnerReply =
    entity?.user?.user_id === firstUser?.user_id && !isMultiUser
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  const handleGoToEntity = useGoToEntity(entity, entityType)

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      if (isMultiUser) {
        dispatch(
          setUserListUsers({
            userListType: UserListType.NOTIFICATION,
            entityType: entityToUserListEntity[entityType],
            id: id as unknown as number
          })
        )
        if (isMobile) {
          dispatch(push(`notification/${id}/users`))
        } else {
          dispatch(openUserListModal(true))
        }
      } else {
        handleGoToEntity(event)
      }

      track(
        make({
          eventName: Name.COMMENTS_NOTIFICATION_OPEN,
          commentId: notification.entityId,
          notificationType: 'thread'
        })
      )
    },
    [
      isMultiUser,
      dispatch,
      entityType,
      id,
      isMobile,
      handleGoToEntity,
      notification.entityId
    ]
  )

  if (!users || !firstUser || !entity || !entity.user) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconMessage color='accent' />}>
        <UserProfilePictureList
          users={users}
          totalUserCount={userIds.length}
          stopPropagation
        />
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={firstUser} notification={notification} />{' '}
        {otherUsersCount > 0 ? (
          <OthersLink othersCount={otherUsersCount} onClick={handleClick} />
        ) : null}
        {messages.replied}{' '}
        {isOwner ? (
          messages.your
        ) : isOwnerReply ? (
          messages.their
        ) : (
          <UserNameLink
            user={entity.user}
            notification={notification}
            isOwner
          />
        )}{' '}
        {entityType.toLowerCase()}{' '}
        <EntityLink entity={entity} entityType={entityType} />
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
