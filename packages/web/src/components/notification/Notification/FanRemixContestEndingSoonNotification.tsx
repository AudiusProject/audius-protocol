import { useCallback } from 'react'

import { useNotificationEntity } from '@audius/common/api'
import {
  FanRemixContestEndingSoonNotification as FanRemixContestEndingSoonNotificationType,
  TrackEntity
} from '@audius/common/store'
import { Flex, IconTrophy } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TrackContent } from './components/TrackContent'
import { UserNameLink } from './components/UserNameLink'
import { getEntityLink } from './utils'

const messages = {
  title: 'Remix Contest',
  description:
    " has a remix contest ending in 72 hours - don't forget to submit your remix"
}

type FanRemixContestEndingSoonNotificationProps = {
  notification: FanRemixContestEndingSoonNotificationType
}

export const FanRemixContestEndingSoonNotification = (
  props: FanRemixContestEndingSoonNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const dispatch = useDispatch()

  const entity = useNotificationEntity(notification) as TrackEntity | null

  const handleClick = useCallback(() => {
    if (entity) {
      dispatch(push(getEntityLink(entity)))
    }
  }, [entity, dispatch])

  if (!entity || !entity.user) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrophy color='accent' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex alignItems='flex-start'>
        <TrackContent track={entity} hideTitle />
        <NotificationBody>
          <UserNameLink user={entity.user} notification={notification} />{' '}
          {messages.description}
        </NotificationBody>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
