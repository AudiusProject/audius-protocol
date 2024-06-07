import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import type {
  CollectionEntity,
  Entity,
  TrackEntity,
  USDCPurchaseBuyerNotification as USDCPurchaseBuyerNotificationType
} from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { getEntityTitle, type Nullable } from '@audius/common/utils'
import { make } from '@audius/web/src/common/store/analytics/actions'
import { lowerCase } from 'lodash'
import { useSelector } from 'react-redux'

import { IconCart } from '@audius/harmony-native'
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
  twitterShare: (
    title: string,
    sellerUsername: string,
    type: Entity.Track | Entity.Album
  ) =>
    `I bought the ${lowerCase(
      type
    )} ${title} by ${sellerUsername} on @Audius! $AUDIO #AudiusPremium`
}
type USDCPurchaseBuyerNotificationProps = {
  notification: USDCPurchaseBuyerNotificationType
}

export const USDCPurchaseBuyerNotification = ({
  notification
}: USDCPurchaseBuyerNotificationProps) => {
  const { entityType } = notification
  const navigation = useNotificationNavigation()
  const content = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity | CollectionEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const sellerUser = notificationUsers ? notificationUsers[0] : null

  const handleShare = useCallback(
    (sellerHandle: string) => {
      const trackTitle = getEntityTitle(content)
      const shareText = messages.twitterShare(
        trackTitle,
        sellerHandle,
        entityType
      )
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_USDC_PURCHASE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText: content ? shareText : '', analytics }
    },
    [content, entityType]
  )

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!content || !sellerUser) return null
  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconCart}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.youJustPurchased} <EntityLink entity={content} />
        {messages.from}
        <UserNameLink user={sellerUser} />
        {messages.exclamation}
      </NotificationText>
      <NotificationTwitterButton
        type='dynamic'
        url={getEntityRoute(content, true)}
        handle={sellerUser.handle}
        shareData={handleShare}
      />
    </NotificationTile>
  )
}
