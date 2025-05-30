import { useCallback } from 'react'

import { useTrack, useRemixes } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { ArtistRemixContestEndedNotification as ArtistRemixContestEndedNotificationType } from '@audius/common/store'
import { Button, Flex, IconTrophy } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import { push } from 'utils/navigation'
import { pickWinnersPage } from 'utils/route'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'

const messages = {
  title: 'Your Remix Contest Ended',
  description:
    "Your remix contest has ended. Don't forget to contact your winners!",
  pickWinnersDescription:
    "Your remix contest has ended. It's time to pick your winners!"
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
  const { isEnabled: isRemixContestWinnersMilestoneEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST_WINNERS_MILESTONE
  )

  const { data: track } = useTrack(entityId)
  const { data: remixes } = useRemixes({
    trackId: entityId,
    isContestEntry: true
  })

  const remixCount = remixes?.pages[0]?.count ?? 0

  const pickWinnersRoute = track ? pickWinnersPage(track?.permalink) : ''

  const handleClick = useCallback(() => {
    if (track) {
      dispatch(
        push(
          isRemixContestWinnersMilestoneEnabled
            ? pickWinnersRoute
            : track.permalink
        )
      )
    }
  }, [track, dispatch, isRemixContestWinnersMilestoneEnabled, pickWinnersRoute])

  if (!track) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconTrophy color='accent' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <Flex column gap='l'>
        <NotificationBody>
          {isRemixContestWinnersMilestoneEnabled
            ? messages.pickWinnersDescription
            : messages.description}
        </NotificationBody>
        {isRemixContestWinnersMilestoneEnabled && remixCount > 0 && (
          <Button css={{ width: 'fit-content' }} size='small' asChild>
            <Link to={pickWinnersRoute} onClick={(e) => e.stopPropagation()}>
              Pick Winners
            </Link>
          </Button>
        )}
      </Flex>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
