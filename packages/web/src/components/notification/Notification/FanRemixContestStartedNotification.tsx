import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import {
  Entity,
  FanRemixContestStartedNotification as FanRemixContestStartedNotificationType,
  TrackEntity
} from '@audius/common/store'
import { Flex, IconTrophy } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
import { fullTrackPage } from 'utils/route'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TrackContent } from './components/TrackContent'
import { UserNameLink } from './components/UserNameLink'

const messages = {
  title: 'New Remix Contest',
  description: 'started a new remix contest for'
}

type FanRemixContestStartedNotificationProps = {
  notification: FanRemixContestStartedNotificationType
}

export const FanRemixContestStartedNotification = (
  props: FanRemixContestStartedNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed, entityId, entityUserId } = notification
  const dispatch = useDispatch()

  const { data: user } = useUser(entityUserId)
  const { data: track } = useTrack(entityId)

  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(fullTrackPage(track.permalink)))
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
          {messages.description}{' '}
          <EntityLink entity={track as TrackEntity} entityType={Entity.Track} />
        </NotificationBody>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
