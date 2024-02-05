import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import {
  notificationsSelectors,
  Entity,
  UserSubscriptionNotification as UserSubscriptionNotificationType
} from '@audius/common/store'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'

import styles from './UserSubscriptionNotification.module.css'
import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { ProfilePicture } from './components/ProfilePicture'
import { UserNameLink } from './components/UserNameLink'
import { IconRelease } from './components/icons'
import { getEntityLink } from './utils'
const { getNotificationEntities, getNotificationUser } = notificationsSelectors

const messages = {
  title: 'New Release',
  posted: 'posted',
  new: 'new'
}

type UserSubscriptionNotificationProps = {
  notification: UserSubscriptionNotificationType
}

export const UserSubscriptionNotification = (
  props: UserSubscriptionNotificationProps
) => {
  const { notification } = props
  const { entityType, entityIds, timeLabel, isViewed, type } = notification
  const user = useSelector((state) => getNotificationUser(state, notification))
  const entities = useSelector((state) =>
    getNotificationEntities(state, notification)
  )
  const uploadCount = entityIds.length
  const isSingleUpload = uploadCount === 1

  const dispatch = useDispatch()
  const record = useRecord()

  const handleClick = useCallback(() => {
    if (entityType === Entity.Track && !isSingleUpload) {
      if (user) {
        dispatch(push(profilePage(user.handle)))
      }
    } else {
      if (entities) {
        const entityLink = getEntityLink(entities[0])
        dispatch(push(entityLink))
        record(
          make(Name.NOTIFICATIONS_CLICK_TILE, {
            kind: type,
            link_to: entityLink
          })
        )
      }
    }
  }, [entityType, isSingleUpload, user, entities, dispatch, record, type])

  if (!user || !entities) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRelease />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <div className={styles.body}>
          <ProfilePicture className={styles.profilePicture} user={user} />
          <span>
            <UserNameLink user={user} notification={notification} />{' '}
            {messages.posted} {isSingleUpload ? 'a' : uploadCount}{' '}
            {messages.new} {entityType.toLowerCase()}
            {isSingleUpload ? '' : 's'}{' '}
            {isSingleUpload ? (
              <EntityLink entity={entities[0]} entityType={entityType} />
            ) : null}
          </span>
        </div>
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
