import { useCallback } from 'react'

import type {
  Nullable,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType,
  TrackEntity,
  StringUSDC
} from '@audius/common'
import {
  notificationsSelectors,
  formatUSDCWeiToUSDString
} from '@audius/common'
import { useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  UserNameLink,
  EntityLink
} from '../Notification'

const { getNotificationUsers, getNotificationEntity } = notificationsSelectors

const messages = {
  title: 'Track Sold',
  congrats: 'Congrats, ',
  justBoughtYourTrack: ' just bought your track ',
  for: ' for ',
  exclamation: '!'
}

type USDCPurchaseSellerNotificationProps = {
  notification: USDCPurchaseSellerNotificationType
}

export const USDCPurchaseSellerNotification = (
  props: USDCPurchaseSellerNotificationProps
) => {
  const { notification } = props
  const navigation = useNotificationNavigation()
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const buyerUser = notificationUsers ? notificationUsers[0] : null
  const { amount } = notification

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate(notification)
    }
  }, [track, navigation, notification])

  if (!track || !buyerUser) return null
  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconCart}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.congrats} <UserNameLink user={buyerUser} />{' '}
        {messages.justBoughtYourTrack} <EntityLink entity={track} /> for $
        {formatUSDCWeiToUSDString(amount.toString() as StringUSDC)}
        {messages.exclamation}
      </NotificationText>
    </NotificationTile>
  )
}
