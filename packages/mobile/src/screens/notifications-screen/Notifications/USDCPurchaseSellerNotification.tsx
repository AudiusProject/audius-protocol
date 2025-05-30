import { useCallback } from 'react'

import type { StringUSDC } from '@audius/common/models'
import type {
  CollectionEntity,
  Entity,
  TrackEntity,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType
} from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { stringUSDCToBN, formatUSDCWeiToUSDString } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { capitalize } from 'lodash'
import { useSelector } from 'react-redux'

import { IconCart } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  UserNameLink
} from '../Notification'

const { getNotificationUsers, getNotificationEntity } = notificationsSelectors

const messages = {
  title: (type: Entity.Track | Entity.Album) => `${capitalize(type)} Sold`,
  congrats: 'Congrats,',
  someone: 'someone',
  justBoughtYourTrack: (type: Entity.Track | Entity.Album) =>
    ` just bought your ${type} `,
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
  const content = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity | CollectionEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const buyerUser = notificationUsers ? notificationUsers[0] : null
  const { amount, extraAmount } = notification

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
        {messages.congrats}{' '}
        {buyerUser.handle ? (
          <UserNameLink user={buyerUser} />
        ) : (
          messages.someone
        )}
        {messages.justBoughtYourTrack(entityType)}
        <EntityLink entity={content} />
        {messages.for + messages.dollar}
        {formatUSDCWeiToUSDString(
          stringUSDCToBN(amount)
            .add(stringUSDCToBN(extraAmount))
            .toString() as StringUSDC
        )}
        {messages.exclamation}
      </NotificationText>
    </NotificationTile>
  )
}
