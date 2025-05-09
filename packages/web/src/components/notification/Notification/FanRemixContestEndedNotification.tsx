import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import {
  FanRemixContestEndedNotification as FanRemixContestEndedNotificationType,
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

const messages = {
  title: 'Remix Contest',
  description:
    "'s remix contest has closed and winners will be announced soon. Good luck!"
}

type FanRemixContestEndedNotificationProps = {
  notification: FanRemixContestEndedNotificationType
}

export const FanRemixContestEndedNotification = (
  props: FanRemixContestEndedNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed, entityId, entityUserId } = notification
  const dispatch = useDispatch()

  const { data: user } = useUser(entityUserId)
  const { data: track } = useTrack(entityId)

  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(track.permalink))
    }
  }, [track, dispatch])

  if (!user || !track) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrophy color='accent' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex>
        <TrackContent track={track as TrackEntity} hideTitle />
        <NotificationBody>
          <UserNameLink user={user} notification={notification} />{' '}
          {messages.description}
        </NotificationBody>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
