import { useCallback } from 'react'

import {
  Nullable,
  Name,
  USDCPurchaseBuyerNotification as USDCPurchaseBuyerNotificationType,
  TrackEntity,
  Entity,
  notificationsSelectors
} from '@audius/common'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

import { EntityLink } from './components/EntityLink'
import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { TwitterShareButton } from './components/TwitterShareButton'
import { UserNameLink } from './components/UserNameLink'
import { IconCart } from './components/icons'
import { getEntityLink } from './utils'

const { getNotificationUsers, getNotificationEntity } = notificationsSelectors

const messages = {
  title: 'Purchase Successful',
  youJustPurchased: 'You just purchased ',
  from: ' from ',
  exclamation: '!',
  twitterShare: (trackTitle: string, sellerUsername: string) =>
    `I bought the track ${trackTitle} by ${sellerUsername} on @Audius! #AudiusPremium`
}

type USDCPurchaseBuyerNotificationProps = {
  notification: USDCPurchaseBuyerNotificationType
}

export const USDCPurchaseBuyerNotification = (
  props: USDCPurchaseBuyerNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const dispatch = useDispatch()
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const sellerUser = notificationUsers ? notificationUsers[0] : null
  const handleClick = useCallback(() => {
    if (track) {
      dispatch(push(getEntityLink(track)))
    }
  }, [dispatch, track])
  const handleShare = useCallback(
    (sellerHandle: string) => {
      const trackTitle = track?.title || ''
      const shareText = messages.twitterShare(trackTitle, sellerHandle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_USDC_PURCHASE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText: track ? shareText : '', analytics }
    },
    [track]
  )
  if (!track || !sellerUser) return null
  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconCart />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.youJustPurchased}{' '}
        <EntityLink entity={track} entityType={Entity.Track} />
        {messages.from}
        <UserNameLink user={sellerUser} notification={notification} />
        {messages.exclamation}
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        url={getEntityLink(track, true)}
        handle={sellerUser.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
