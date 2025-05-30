import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import { ArtistRemixContestEndingSoonNotification as ArtistRemixContestEndingSoonNotificationType } from '@audius/common/store'
import { Flex, IconTrophy, Text } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { TrackLink } from 'components/link'
import { push } from 'utils/navigation'

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
      dispatch(push(track.permalink))
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
            <TrackLink
              css={{ display: 'inline' }}
              variant='secondary'
              size='l'
              trackId={track.track_id}
            />
            {messages.description2}
          </Text>
        </NotificationBody>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
