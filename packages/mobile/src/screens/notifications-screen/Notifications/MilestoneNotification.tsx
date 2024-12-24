import { useCallback } from 'react'

import { useProxySelector } from '@audius/common/hooks'
import type { User } from '@audius/common/models'
import type {
  EntityType,
  MilestoneNotification as MilestoneNotificationType
} from '@audius/common/store'
import { notificationsSelectors, Achievement } from '@audius/common/store'
import { isEntityHidden, route, type Nullable } from '@audius/common/utils'
import { formatCount } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { IconTrophy } from '@audius/harmony-native'
import { env } from 'app/env'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { EventNames } from 'app/types/analytics'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationTwitterButton
} from '../Notification'
import { getEntityRoute } from '../Notification/utils'
const { getNotificationEntity, getNotificationUser } = notificationsSelectors

const messages = {
  title: 'Milestone Reached!',
  follows: 'You have reached over',
  your: 'Your',
  reached: 'has reached over',
  followerAchievementText: (followersCount: number) =>
    `I just hit over ${followersCount} followers on @audius! #Audius $AUDIO`,
  achievementText: (
    type: string,
    name: string,
    value: number,
    achievement: string
  ) => {
    const achievementText =
      achievement === Achievement.Listens ? 'plays' : achievement
    return `My ${type} ${name} has more than ${value} ${achievementText} on @audius
Check it out! #Audius $AUDIO`
  }
}

const getTwitterShareData = (
  notification: MilestoneNotificationType,
  entity?: Nullable<EntityType>,
  user?: Nullable<User>
) => {
  const { achievement, value } = notification
  switch (achievement) {
    case Achievement.Followers: {
      if (user) {
        const link = `${env.AUDIUS_URL}${route.profilePage(user.handle)}`
        const text = messages.followerAchievementText(value)
        return { text, link }
      }
      return { text: '', link: '' }
    }
    case Achievement.Favorites:
    case Achievement.Listens:
    case Achievement.Reposts: {
      if (entity && !isEntityHidden(entity)) {
        const { entityType } = notification
        const link = getEntityRoute(entity, true)
        const text = messages.achievementText(
          entityType,
          'title' in entity ? entity.title : entity.playlist_name,
          value,
          achievement
        )
        return { text, link }
      }
      return { text: '', link: '' }
    }
    default: {
      return { text: '', link: '' }
    }
  }
}

type MilestoneNotificationProps = {
  notification: MilestoneNotificationType
}

export const MilestoneNotification = (props: MilestoneNotificationProps) => {
  const { notification } = props
  const { achievement } = notification
  const entity = useProxySelector(
    (state) => getNotificationEntity(state, notification),
    [notification]
  )
  const user = useSelector((state) => getNotificationUser(state, notification))

  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const renderBody = () => {
    const { achievement, value } = notification
    if (achievement === Achievement.Followers) {
      return `${messages.follows} ${formatCount(value)} ${achievement}`
    } else if (entity) {
      const { entityType } = notification
      const achievementText =
        achievement === Achievement.Listens ? 'plays' : achievement

      return (
        <>
          {messages.your} {entityType} <EntityLink entity={entity} />{' '}
          {messages.reached} {formatCount(value)} {achievementText}
        </>
      )
    }
    return null
  }

  const isMissingRequiredUser = achievement === Achievement.Followers && !user
  const isMissingRequiredEntity =
    achievement !== Achievement.Followers && !entity

  if (isMissingRequiredUser || isMissingRequiredEntity) {
    return null
  }

  const { link, text } = getTwitterShareData(notification, entity, user)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrophy}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{renderBody()}</NotificationText>
      {link && text ? (
        <NotificationTwitterButton
          type='static'
          url={link}
          shareText={text}
          analytics={{
            eventName: EventNames.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE,
            milestone: text
          }}
        />
      ) : null}
    </NotificationTile>
  )
}
