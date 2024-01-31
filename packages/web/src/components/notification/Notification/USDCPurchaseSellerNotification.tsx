import {
  notificationsSelectors,
  Entity,
  TrackEntity,
  USDCPurchaseSellerNotification as USDCPurchaseSellerNotificationType
} from '@audius/common/store'

import { useCallback } from 'react'

import { StringUSDC } from '@audius/common/models'
import {
  stringUSDCToBN,
  formatUSDCWeiToUSDString,
  Nullable
} from '@audius/common/utils'
import { push } from 'connected-react-router'
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
  title: 'Track Sold',
  congrats: 'Congrats, ',
  justBoughtYourTrack: ' just bought your track ',
  for: ' for ',
  exclamation: '!'
}

type USDCPurchaseSellerNotificationProps = {
  notification: USDCPurchaseSellerNotificationType
}

export const USDCPurchaseSellerNotification = (
  props: USDCPurchaseSellerNotificationProps
) => {
  const { notification } = props
  const dispatch = useDispatch()
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const buyerUser = notificationUsers ? notificationUsers[0] : null
  const { amount, extraAmount } = notification
  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(getEntityLink(track)))
    }
  }, [dispatch, track])
  if (!track || !buyerUser) return null
  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconCart />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.congrats}{' '}
        <UserNameLink user={buyerUser} notification={notification} />{' '}
        {messages.justBoughtYourTrack}{' '}
        <EntityLink entity={track} entityType={Entity.Track} /> for $
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
