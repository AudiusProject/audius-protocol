import { useCallback } from 'react'

import {
  useCurrentAccountUser,
  useNotificationEntity
} from '@audius/common/api'
import { Name, User } from '@audius/common/models'
import {
  Achievement,
  EntityType,
  MilestoneNotification as MilestoneNotificationType
} from '@audius/common/store'
import {
  formatCount,
  isEntityHidden,
  Nullable,
  route
} from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { push } from 'utils/navigation'
import { fullProfilePage } from 'utils/route'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { IconMilestone } from './components/icons'
import { getEntityLink } from './utils'

const { profilePage } = route

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

const getAchievementText = (
  notification: MilestoneNotificationType,
  entity?: Nullable<EntityType>,
  user?: Nullable<User>
) => {
  const { achievement, value } = notification
  switch (achievement) {
    case Achievement.Followers: {
      if (user) {
        const link = fullProfilePage(user.handle)
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
        const link = getEntityLink(entity, true)
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
  const { timeLabel, isViewed, achievement } = notification
  const entity = useNotificationEntity(notification)
  const { data: user } = useCurrentAccountUser()
  const dispatch = useDispatch()

  const renderBody = () => {
    const { achievement, value } = notification
    if (achievement === Achievement.Followers) {
      return `${messages.follows} ${formatCount(value)} ${achievement}`
    } else if (entity) {
      const { entityType } = notification
      const achievementText =
        achievement === Achievement.Listens ? 'plays' : achievement

      return (
        <span>
          {messages.your} {entityType}{' '}
          <EntityLink entity={entity} entityType={entityType} />{' '}
          {messages.reached} {formatCount(value)} {achievementText}
        </span>
      )
    }
  }

  const handleClick = useCallback(() => {
    if (notification.achievement === Achievement.Followers) {
      if (user) {
        dispatch(push(profilePage(user.handle)))
      }
    } else if (entity) {
      dispatch(push(getEntityLink(entity)))
    }
  }, [notification, user, entity, dispatch])

  const isMissingRequiredUser = achievement === Achievement.Followers && !user
  const isMissingRequiredEntity =
    achievement !== Achievement.Followers && !entity

  if (isMissingRequiredUser || isMissingRequiredEntity) {
    return null
  }

  const { link, text } = getAchievementText(notification, entity, user)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconMilestone />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>{renderBody()}</NotificationBody>
      {link && text ? (
        <XShareButton
          type='static'
          url={link}
          shareText={text}
          analytics={make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
            milestone: text
          })}
        />
      ) : null}
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
