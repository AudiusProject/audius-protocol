import { useCallback } from 'react'

import { useNotificationEntity, useUser } from '@audius/common/api'
import type { User } from '@audius/common/models'
import type {
  CollectionEntity,
  TrackEntity,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType
} from '@audius/common/store'
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
  body: (
    buyerUser: User,
    entityType: string,
    content: TrackEntity | CollectionEntity,
    totalAmount: bigint
  ) => (
    <>
      {'Congrats, '}
      {buyerUser?.handle ? <UserNameLink user={buyerUser} /> : 'someone'}
      {` just bought your ${entityType} `}
      <EntityLink entity={content} />
      {' for $'}
      {USDC(totalAmount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
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
  const totalAmount =
    USDC(BigInt(amount)).value + USDC(BigInt(extraAmount)).value

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!content || !buyerUser) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconCart}>
        <NotificationTitle>{messages.title(entityType)}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        {messages.body(buyerUser, entityType, content, totalAmount)}
      </NotificationText>
    </NotificationTile>
  )
}
