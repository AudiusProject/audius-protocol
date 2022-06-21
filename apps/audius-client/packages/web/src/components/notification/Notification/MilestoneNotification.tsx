import { useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { Achievement, Milestone } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'
import { make, useRecord } from 'store/analytics/actions'
import { fullProfilePage, profilePage } from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { IconMilestone } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: 'Milestone Reached!',
  follows: 'You have reached over',
  your: 'Your',
  reached: 'has reached over',
  followerAchievementText: (followersCount: number) =>
    `I just hit over ${followersCount} followers on @AudiusProject #Audius!`,
  achievementText: (
    type: string,
    name: string,
    value: number,
    achievement: string
  ) => {
    const achievementText =
      achievement === Achievement.Listens ? 'plays' : achievement
    return `My ${type} ${name} has more than ${value} ${achievementText} on @AudiusProject #Audius
Check it out!`
  }
}

const getAchievementText = (notification: Milestone) => {
  const { achievement, user, value } = notification
  switch (achievement) {
    case Achievement.Followers: {
      const link = fullProfilePage(user.handle)
      const text = messages.followerAchievementText(value)
      return { text, link }
    }
    case Achievement.Favorites:
    case Achievement.Listens:
    case Achievement.Reposts: {
      const { entity, entityType } = notification
      const link = getEntityLink(entity, true)
      const text = messages.achievementText(
        entityType,
        'title' in entity ? entity.title : entity.playlist_name,
        value,
        achievement
      )
      return { text, link }
    }
    default: {
      return { text: '', link: '' }
    }
  }
}

type MilestoneNotificationProps = {
  notification: Milestone
}

export const MilestoneNotification = (props: MilestoneNotificationProps) => {
  const { notification } = props
  const { timeLabel, isViewed, user } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const renderBody = () => {
    if (notification.achievement === Achievement.Followers) {
      const { achievement, value } = notification
      return `${messages.follows} ${formatCount(value)} ${achievement}`
    } else {
      const { entity, entityType, achievement, value, user } = notification
      const entityWithUser = { ...entity, user }
      const achievementText =
        achievement === Achievement.Listens ? 'plays' : achievement

      return (
        <span>
          {messages.your} {entityType}{' '}
          <EntityLink entity={entityWithUser} entityType={entityType} />{' '}
          {messages.reached} {formatCount(value)} {achievementText}
        </span>
      )
    }
  }

  const handleShare = useCallback(async () => {
    const { link, text } = getAchievementText(notification)
    openTwitterLink(link, text)
    record(
      make(Name.NOTIFICATIONS_CLICK_MILESTONE_TWITTER_SHARE, {
        milestone: text
      })
    )
  }, [notification, record])

  const handleClick = useCallback(() => {
    if (notification.achievement === Achievement.Followers) {
      dispatch(push(profilePage(user.handle)))
    } else {
      const { entity } = notification
      dispatch(push(getEntityLink(entity)))
    }
  }, [notification, user, dispatch])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconMilestone />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>{renderBody()}</NotificationBody>
      <TwitterShareButton onClick={handleShare} />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
