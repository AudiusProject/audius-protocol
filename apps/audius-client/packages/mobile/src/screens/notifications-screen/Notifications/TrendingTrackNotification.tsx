import { useCallback } from 'react'

import { getNotificationEntity } from 'audius-client/src/common/store/notifications/selectors'
import { TrendingTrack } from 'audius-client/src/common/store/notifications/types'
import { isEqual } from 'lodash'

import IconTrending from 'app/assets/images/iconTrending.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getTrackRoute } from 'app/utils/routes'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const getRankSuffix = (rank: number) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

const messages = {
  title: 'Trending on Audius!',
  your: 'Your track',
  is: 'is',
  trending: 'on Trending right now!'
}

type TrendingTrackNotificationProps = {
  notification: TrendingTrack
}

export const TrendingTrackNotification = (
  props: TrendingTrackNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const rankSuffix = getRankSuffix(rank)
  const track = useSelectorWeb(
    (state) => getNotificationEntity(state, notification),
    isEqual
  )
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate({
      native: { screen: 'Track', params: { id: track.track_id } },
      web: { route: getTrackRoute(track) }
    })
  }, [navigation, track])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrending}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.your} <EntityLink entity={track} /> {messages.is} {rank}
        {rankSuffix} {messages.trending}
      </NotificationText>
    </NotificationTile>
  )
}
