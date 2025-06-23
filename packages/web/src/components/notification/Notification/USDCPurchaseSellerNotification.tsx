import { useCallback } from 'react'

import { useNotificationEntity, useUsers } from '@audius/common/api'
import {
  Entity,
  TrackEntity,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType,
  CollectionEntity
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { USDC, UsdcWei } from '@audius/fixed-decimal'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { UserNameLink } from './components/UserNameLink'
import { IconCart } from './components/icons'
import { getEntityLink } from './utils'

const messages = {
  title: (type: Entity.Track | Entity.Album) => `${capitalize(type)} Sold`,
  congrats: 'Congrats, ',
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
  const dispatch = useDispatch()
  const content = useNotificationEntity(notification) as Nullable<
    TrackEntity | CollectionEntity
  >
  const { data: users } = useUsers(notification.userIds.slice(0, 1))
  const buyerUser = users?.[0]
  const { amount, extraAmount } = notification

  const handleClick = useCallback(() => {
    if (content) {
      dispatch(push(getEntityLink(content)))
    }
  }, [dispatch, content])

  if (!content || !buyerUser) return null

  const totalAmount = USDC(amount).value + USDC(extraAmount).value
  const formattedAmount = USDC(totalAmount).toLocaleString()

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconCart />}>
        <NotificationTitle>{messages.title(entityType)}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.congrats}
        {buyerUser.handle ? (
          <UserNameLink user={buyerUser} notification={notification} />
        ) : (
          messages.someone
        )}
        {messages.justBoughtYourTrack(entityType)}
        <EntityLink entity={content} entityType={entityType} />
        {messages.for + messages.dollar}
        {formattedAmount}
        {messages.exclamation}
      </NotificationBody>
    </NotificationTile>
  )
}
