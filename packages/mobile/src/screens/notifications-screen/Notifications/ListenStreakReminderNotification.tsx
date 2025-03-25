import { useCallback } from 'react'

import { listenStreakReminderMessages as messages } from '@audius/common/messages'
import { ChallengeName, Name } from '@audius/common/models'
import type { ListenStreakReminderNotification as ListenStreakReminderNotificationType } from '@audius/common/store'
import { audioRewardsPageActions, modalsActions } from '@audius/common/store'
import { make, useRecord } from 'common/store/analytics/actions'
import { Image } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconAudiusLogo } from '@audius/harmony-native'
import Fire from 'app/assets/images/emojis/fire.png'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle
} from '../Notification'

const { setChallengeRewardsModalType } = audioRewardsPageActions
const { setVisibility } = modalsActions

type ListenStreakReminderNotificationProps = {
  notification: ListenStreakReminderNotificationType
}

export const ListenStreakReminderNotification = (
  props: ListenStreakReminderNotificationProps
) => {
  const { notification } = props
  const { type } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const handlePress = useCallback(() => {
    dispatch(
      setChallengeRewardsModalType({
        modalType: ChallengeName.ListenStreakEndless
      })
    )
    dispatch(setVisibility({ modal: 'ChallengeRewards', visible: true }))
    record(make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: '' }))
  }, [dispatch, record, type])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader
        icon={IconAudiusLogo}
        emoji={<Image source={Fire} style={{ width: 32, height: 32 }} />}
      >
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.body(notification.streak)}</NotificationText>
    </NotificationTile>
  )
}
