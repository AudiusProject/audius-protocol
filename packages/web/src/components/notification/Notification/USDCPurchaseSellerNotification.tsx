import { useCallback } from 'react'

import { useNotificationEntity, useUsers } from '@audius/common/api'
import type { User } from '@audius/common/models'
import {
  Entity,
  TrackEntity,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType,
  CollectionEntity
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { USDC } from '@audius/fixed-decimal'
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
  title: (entityType: Entity.Track | Entity.Album) =>
    `${capitalize(entityType)} Sold`,

  userNameLink: (
    user: User,
    notification: USDCPurchaseSellerNotificationType
  ) => <UserNameLink user={user} notification={notification} />,
  body: (
    buyerUser: Nullable<User>,
    notification: USDCPurchaseSellerNotificationType,
    entityType: Entity.Track | Entity.Album,
    content: TrackEntity | CollectionEntity,
    totalAmount: bigint
  ) => (
    <>
      {'Congrats, '}
      {buyerUser?.handle ? (
        <UserNameLink user={buyerUser} notification={notification} />
      ) : (
        'someone'
      )}
      {` just bought your ${entityType} `}
      <EntityLink entity={content} entityType={entityType} />
      {' for '}
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
  const dispatch = useDispatch()
  const content = useNotificationEntity(notification) as Nullable<
    TrackEntity | CollectionEntity
  >
  const { data: users } = useUsers(notification.userIds.slice(0, 1))
  const buyerUser = users?.[0]
  const { amount, extraAmount } = notification
  const totalAmount =
    USDC(BigInt(amount)).value + USDC(BigInt(extraAmount)).value

  const handleClick = useCallback(() => {
    if (content) {
      dispatch(push(getEntityLink(content)))
    }
  }, [dispatch, content])

  if (!content || !buyerUser) return null

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconCart />}>
        <NotificationTitle>{messages.title(entityType)}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.body(
          buyerUser,
          notification,
          entityType,
          content,
          totalAmount
        )}
      </NotificationBody>
    </NotificationTile>
  )
}
