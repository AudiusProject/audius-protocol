import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import {
  Entity,
  ArtistRemixContestEndingSoonNotification as ArtistRemixContestEndingSoonNotificationType,
  TrackEntity
} from '@audius/common/store'
import { Flex, IconTrophy, Text } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
import { fullTrackPage } from 'utils/route'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'

const messages = {
  title: 'Remix Contest',
  description1: `Your remix contest for `,
  description2: ` is ending in 48 hours!`
}

type ArtistRemixContestEndingSoonNotificationProps = {
  notification: ArtistRemixContestEndingSoonNotificationType
}

export const ArtistRemixContestEndingSoonNotification = (
  props: ArtistRemixContestEndingSoonNotificationProps
) => {
  const { notification } = props
  const { entityId, timeLabel, isViewed } = notification
  const dispatch = useDispatch()

  const { data: track } = useTrack(entityId)

  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(fullTrackPage((track as TrackEntity).permalink)))
    }
  }, [track, dispatch])

  if (!track) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrophy color='accent' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex>
        <NotificationBody>
          <Text variant='body' size='l'>
            {messages.description1}
            <EntityLink
              entity={track as TrackEntity}
              entityType={Entity.Track}
            />
            {messages.description2}
          </Text>
        </NotificationBody>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
