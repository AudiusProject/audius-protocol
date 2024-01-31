import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import type {
  TrackEntity,
  USDCPurchaseBuyerNotification as USDCPurchaseBuyerNotificationType
} from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { make } from 'audius-client/src/common/store/analytics/actions'
import { useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  NotificationTwitterButton,
  UserNameLink,
  EntityLink
} from '../Notification'
import { getEntityRoute } from '../Notification/utils'

const { getNotificationUsers, getNotificationEntity } = notificationsSelectors

const messages = {
  title: 'Purchase Successful',
  youJustPurchased: 'You just purchased',
  from: ' from ',
  exclamation: '!',
  twitterShare: (trackTitle: string, sellerHandle: string) =>
    `I bought the track ${trackTitle} by ${sellerHandle} on @Audius! #AudiusPremium`
}
type USDCPurchaseBuyerNotificationProps = {
  notification: USDCPurchaseBuyerNotificationType
}

export const USDCPurchaseBuyerNotification = ({
  notification
}: USDCPurchaseBuyerNotificationProps) => {
  const navigation = useNotificationNavigation()
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const sellerUser = notificationUsers ? notificationUsers[0] : null

  const handleShare = useCallback(
    (sellerHandle: string) => {
      const trackTitle = track?.title || ''
      const shareText = messages.twitterShare(trackTitle, sellerHandle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_USDC_PURCHASE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText: track ? shareText : '', analytics }
    },
    [track]
  )

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate(notification)
    }
  }, [track, navigation, notification])

  if (!track || !sellerUser) return null
  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconCart}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.youJustPurchased} <EntityLink entity={track} />
        {messages.from}
        <UserNameLink user={sellerUser} />
        {messages.exclamation}
      </NotificationText>
      <NotificationTwitterButton
        type='dynamic'
        url={getEntityRoute(track, true)}
        handle={sellerUser.handle}
        shareData={handleShare}
      />
    </NotificationTile>
  )
}
