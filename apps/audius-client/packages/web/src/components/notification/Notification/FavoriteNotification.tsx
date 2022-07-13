import { MouseEventHandler, useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Favorite } from 'common/store/notifications/types'
import {
  setUsers as setUserListUsers,
  setVisibility as openUserListModal
} from 'store/application/ui/userListModal/slice'
import { UserListType } from 'store/application/ui/userListModal/types'
import { isMobile } from 'utils/clientUtil'

import { EntityLink, useGoToEntity } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { UserNameLink } from './components/UserNameLink'
import { UserProfilePictureList } from './components/UserProfilePictureList'
import { IconFavorite } from './components/icons'
import { entityToUserListEntity, formatOthersCount } from './utils'

const messages = {
  others: formatOthersCount,
  reposted: ' reposted your '
}

type FavoriteNotificationProps = {
  notification: Favorite
}
export const FavoriteNotification = (props: FavoriteNotificationProps) => {
  const { notification } = props
  const { id, users, userIds, entity, entityType, timeLabel, isViewed } =
    notification
  const [firstUser] = users
  const otherUsersCount = userIds.length - 1
  const isMultiUser = userIds.length > 1
  const dispatch = useDispatch()

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
        if (isMobile()) {
          dispatch(push(`notification/${id}/users`))
        } else {
          dispatch(openUserListModal(true))
        }
      } else {
        handleGoToEntity(event)
      }
    },
    [isMultiUser, dispatch, entityType, id, handleGoToEntity]
  )

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconFavorite />}>
        <UserProfilePictureList
          users={users}
          totalUserCount={userIds.length}
          stopPropagation
        />
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={firstUser} notification={notification} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.reposted}
        {entityType.toLowerCase()}{' '}
        <EntityLink entity={entity} entityType={entityType} />
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
