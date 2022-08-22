import { useCallback } from 'react'

import type {
  Nullable,
  TrackEntity,
  TrendingTrackNotification as TrendingTrackNotificationType
} from '@audius/common'
import { notificationsSelectors } from '@audius/common'

import IconTrending from 'app/assets/images/iconTrending.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getTrackRoute } from 'app/utils/routes'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'
const { getNotificationEntity } = notificationsSelectors

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
  notification: TrendingTrackNotificationType
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
  ) as Nullable<TrackEntity>
  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate({
        native: { screen: 'Track', params: { id: track.track_id } },
        web: { route: getTrackRoute(track) }
      })
    }
  }, [navigation, track])

  if (!track) return null

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
