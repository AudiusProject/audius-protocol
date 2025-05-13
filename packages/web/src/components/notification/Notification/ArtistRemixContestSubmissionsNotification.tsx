import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import { ArtistRemixContestSubmissionsNotification as ArtistRemixContestSubmissionsNotificationType } from '@audius/common/store'
import { IconTrophy } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { TrackLink } from 'components/link'
import { push } from 'utils/navigation'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'

const messages = {
  title: 'New Remix Submission!',
  description: 'Your remix contest for ',
  firstSubmission: ' received its first submission!',
  description2: (milestone: number) => ` has received ${milestone} submissions!`
}

type ArtistRemixContestSubmissionsNotificationProps = {
  notification: ArtistRemixContestSubmissionsNotificationType
}

export const ArtistRemixContestSubmissionsNotification = ({
  notification
}: ArtistRemixContestSubmissionsNotificationProps) => {
  const { entityId, milestone, timeLabel, isViewed } = notification
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
      <NotificationBody>
        {messages.description}
        <TrackLink
          css={{ display: 'inline' }}
          variant='secondary'
          size='l'
          trackId={track.track_id}
        />
        {milestone === 1
          ? messages.firstSubmission
          : messages.description2(milestone)}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
