import {
  notificationsSelectors,
  Entity,
  RepostOfRepostNotification as RepostOfRepostNotificationType
} from '@audius/common/store'

import { useSelector } from 'utils/reducer'

import { EntityLink, useGoToEntity } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { OthersText } from './components/OthersLink'
import { UserNameLink } from './components/UserNameLink'
import { UserProfilePictureList } from './components/UserProfilePictureList'
import { IconRepost } from './components/icons'
import { USER_LENGTH_LIMIT } from './utils'
const { getNotificationEntity, getNotificationUsers } = notificationsSelectors

const messages = {
  reposted: 'reposted your repost of'
}

type RepostOfRepostNotificationProps = {
  notification: RepostOfRepostNotificationType
}

export const RepostOfRepostNotification = (
  props: RepostOfRepostNotificationProps
) => {
  const { notification } = props
  const { userIds, entityType, timeLabel, isViewed } = notification
  const users = useSelector((state) =>
    getNotificationUsers(state, notification, USER_LENGTH_LIMIT)
  )
  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const entity = useSelector((state) =>
    getNotificationEntity(state, notification)
  )

  const entityTypeText =
    entity && 'is_album' in entity && entity.is_album
      ? Entity.Album
      : entityType

  const handleGoToEntity = useGoToEntity(entity, entityType)

  if (!users || !firstUser || !entity) return null

  return (
    <NotificationTile
      notification={notification}
      onClick={handleGoToEntity}
      disableClosePanel
    >
      <NotificationHeader icon={<IconRepost />}>
        <UserProfilePictureList
          users={users}
          totalUserCount={userIds.length}
          stopPropagation
        />
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={firstUser} notification={notification} />{' '}
        {otherUsersCount > 0 ? (
          <OthersText othersCount={otherUsersCount} />
        ) : null}{' '}
        {messages.reposted} {entityTypeText.toLowerCase()}{' '}
        <EntityLink entity={entity} entityType={entityTypeText} />
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
