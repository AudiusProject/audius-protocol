import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import { ArtistRemixContestEndedNotification as ArtistRemixContestEndedNotificationType } from '@audius/common/store'
import { Flex, IconTrophy } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'

const messages = {
  title: 'Your Remix Contest Ended',
  description:
    "Your remix contest has ended. Don't forget to contact your winners!"
}

type ArtistRemixContestEndedNotificationProps = {
  notification: ArtistRemixContestEndedNotificationType
}

export const ArtistRemixContestEndedNotification = (
  props: ArtistRemixContestEndedNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed, entityId } = notification
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
        <NotificationBody>{messages.description}</NotificationBody>
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
