import { useCallback } from 'react'

import {
  getNotificationEntity,
  getNotificationUser
} from 'audius-client/src/common/store/notifications/selectors'
import {
  Achievement,
  Milestone
} from 'audius-client/src/common/store/notifications/types'
import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'
import { isEqual } from 'lodash'

import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { formatCount } from 'app/utils/format'
import { getUserRoute } from 'app/utils/routes'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../Notification'
import { getEntityRoute, getEntityScreen } from '../Notification/utils'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'Milestone Reached!',
  follows: 'You have reached over',
  your: 'Your',
  reached: 'has reached over',
  followerAchievementText: (followersCount: number) =>
    `I just hit over ${followersCount} followers on @AudiusProject #Audius!`
}

type MilestoneNotificationProps = {
  notification: Milestone
}

export const MilestoneNotification = (props: MilestoneNotificationProps) => {
  const { notification } = props
  const entity = useSelectorWeb(
    state => getNotificationEntity(state, notification),
    isEqual
  )
  const user = useSelectorWeb(state => getNotificationUser(state, notification))

  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (notification.achievement === Achievement.Followers) {
      if (user) {
        navigation.navigate({
          native: {
            screen: 'Profile',
            params: { handle: user.handle, fromNotifications: true }
          },
          web: { route: getUserRoute(user), fromPage: NOTIFICATION_PAGE }
        })
      }
    } else {
      if (entity) {
        navigation.navigate({
          native: getEntityScreen(entity),
          web: { route: getEntityRoute(entity) }
        })
      }
    }
  }, [notification, user, navigation, entity])

  const renderBody = () => {
    if (notification.achievement === Achievement.Followers) {
      const { achievement, value } = notification
      return `${messages.follows} ${formatCount(value)} ${achievement}`
    } else {
      const { entityType, achievement, value } = notification
      const achievementText =
        achievement === Achievement.Listens ? 'plays' : achievement

      return (
        <>
          {messages.your} {entityType} <EntityLink entity={entity} />{' '}
          {messages.reached} {formatCount(value)} {achievementText}
        </>
      )
    }
  }

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrophy}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{renderBody()}</NotificationText>
    </NotificationTile>
  )
}
