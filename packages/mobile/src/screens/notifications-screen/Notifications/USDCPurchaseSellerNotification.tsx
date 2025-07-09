import React, { useCallback } from 'react'

import { useNotificationEntity, useUser } from '@audius/common/api'
import type { USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType } from '@audius/common/store'
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
  userNameLink: (user: any) => <UserNameLink user={user} />,
  entityLink: (entity: any) => <EntityLink entity={entity} />,
  body: (
    buyerUser: any,
    entityType: string,
    content: any,
    formattedAmount: string
  ) => (
    <>
      {'Congrats, '}
      {buyerUser?.handle ? messages.userNameLink(buyerUser) : 'someone'}
      {` just bought your ${entityType} `}
      {messages.entityLink(content)}
      {' for '}
      {formattedAmount}
      {'!'}
    </>
  )
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

  const totalAmount =
    USDC(BigInt(amount)).value + USDC(BigInt(extraAmount)).value
  const formattedAmount = USDC(totalAmount).toLocaleString()

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconCart}>
        <NotificationTitle>{messages.title(entityType)}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.body(buyerUser, entityType, content, formattedAmount)}
      </NotificationText>
    </NotificationTile>
  )
}
