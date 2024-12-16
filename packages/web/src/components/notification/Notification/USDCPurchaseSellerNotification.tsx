import { useCallback } from 'react'

import { StringUSDC } from '@audius/common/models'
import {
  notificationsSelectors,
  Entity,
  TrackEntity,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType,
  CollectionEntity
} from '@audius/common/store'
import {
  stringUSDCToBN,
  formatUSDCWeiToUSDString,
  Nullable
} from '@audius/common/utils'
import { push } from 'connected-react-router'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { UserNameLink } from './components/UserNameLink'
import { IconCart } from './components/icons'
import { getEntityLink } from './utils'

const { getNotificationEntity, getNotificationUsers } = notificationsSelectors

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
  const content = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity | CollectionEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const buyerUser = notificationUsers ? notificationUsers[0] : null
  const { amount, extraAmount } = notification

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
        {messages.congrats}
        {buyerUser.handle ? (
          <UserNameLink user={buyerUser} notification={notification} />
        ) : (
          messages.someone
        )}
        {messages.justBoughtYourTrack(entityType)}
        <EntityLink entity={content} entityType={entityType} />
        {messages.for + messages.dollar}
        {formatUSDCWeiToUSDString(
          stringUSDCToBN(amount)
            .add(stringUSDCToBN(extraAmount))
            .toString() as StringUSDC
        )}
        {messages.exclamation}
      </NotificationBody>
    </NotificationTile>
  )
}
