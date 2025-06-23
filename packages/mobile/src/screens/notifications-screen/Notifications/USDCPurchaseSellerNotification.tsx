import React, { useCallback } from 'react'

import { useNotificationEntity, useUser } from '@audius/common/api'
import type { USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType } from '@audius/common/store'
import type { UsdcWei } from '@audius/fixed-decimal'
import { USDC } from '@audius/fixed-decimal'
import { capitalize } from 'lodash'

import { IconCart } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  UserNameLink,
  EntityLink
} from '../Notification'

const messages = {
  title: (type: string) => `${capitalize(type)} Sold`,
  congrats: 'Congrats, ',
  someone: 'someone',
  justBoughtYourTrack: (type: string) => ` just bought your ${type} `,
  for: ' for ',
  exclamation: '!',
  dollar: '$'
}

type USDCPurchaseSellerNotificationProps = {
  notification: USDCPurchaseSellerNotificationType
}

export const USDCPurchaseSellerNotification = (
  props: USDCPurchaseSellerNotificationProps
) => {
  const { notification } = props
  const { entityType } = notification
  const navigation = useNotificationNavigation()
  const content = useNotificationEntity(notification)
  const { data: buyerUser } = useUser(notification.userIds[0])
  const { amount, extraAmount } = notification

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!content || !buyerUser) return null

  const totalAmount = USDC(amount).value + USDC(extraAmount).value
  const formattedAmount = USDC(totalAmount).toLocaleString()

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconCart}>
        <NotificationTitle>{messages.title(entityType)}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.congrats}{' '}
        {buyerUser.handle ? (
          <UserNameLink user={buyerUser} />
        ) : (
          messages.someone
        )}
        {messages.justBoughtYourTrack(entityType)}
        <EntityLink entity={content} />
        {messages.for + messages.dollar}
        {formattedAmount}
        {messages.exclamation}
      </NotificationText>
    </NotificationTile>
  )
}
