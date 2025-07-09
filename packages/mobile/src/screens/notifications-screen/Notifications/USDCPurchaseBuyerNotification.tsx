import React, { useCallback } from 'react'

import { useNotificationEntity, useUser } from '@audius/common/api'
import type { User } from '@audius/common/models'
import { Name } from '@audius/common/models'
import type {
  CollectionEntity,
  TrackEntity,
  USDCPurchaseBuyerNotification as USDCPurchaseBuyerNotificationType
} from '@audius/common/store'
import { getEntityTitle } from '@audius/common/utils'
import { make } from '@audius/web/src/common/store/analytics/actions'
import { lowerCase } from 'lodash'

import { IconCart } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  NotificationXButton,
  UserNameLink,
  EntityLink
} from '../Notification'
import { getEntityRoute } from '../Notification/utils'

const messages = {
  title: 'Purchase Successful',
  xShare: (title: string, sellerUsername: string, type: string) =>
    `I bought the ${lowerCase(
      type
    )} ${title} by ${sellerUsername} on @Audius! $AUDIO`,
  body: (content: TrackEntity | CollectionEntity, sellerUser: User) => (
    <>
      {'You just purchased '}
      <EntityLink entity={content} />
      {' from '}
      <UserNameLink user={sellerUser} />
      {'!'}
    </>
  )
}

type USDCPurchaseBuyerNotificationProps = {
  notification: USDCPurchaseBuyerNotificationType
}

export const USDCPurchaseBuyerNotification = ({
  notification
}: USDCPurchaseBuyerNotificationProps) => {
  const { entityType } = notification
  const navigation = useNotificationNavigation()
  const content = useNotificationEntity(notification)
  const { data: sellerUser } = useUser(notification.userIds[0])

  const handleShare = useCallback(
    (sellerHandle: string) => {
      if (!content) return null
      const trackTitle = getEntityTitle(content)
      const shareText = messages.xShare(trackTitle, sellerHandle, entityType)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_USDC_PURCHASE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText, analytics }
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
      <NotificationText>{messages.body(content, sellerUser)}</NotificationText>
      <NotificationXButton
        type='dynamic'
        url={getEntityRoute(content, true)}
        handle={sellerUser.handle}
        shareData={handleShare}
      />
    </NotificationTile>
  )
}
