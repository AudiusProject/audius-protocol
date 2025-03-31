import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import {
  notificationsSelectors,
  Entity,
  TrackEntity,
  USDCPurchaseBuyerNotification as USDCPurchaseBuyerNotificationType,
  CollectionEntity
} from '@audius/common/store'
import { Nullable, getEntityTitle } from '@audius/common/utils'
import { lowerCase } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { push } from 'utils/navigation'
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
  twitterShare: (
    title: string,
    sellerUsername: string,
    type: Entity.Track | Entity.Album
  ) =>
    `I bought the ${lowerCase(
      type
    )} ${title} by ${sellerUsername} on @Audius! $AUDIO #AudiusPremium`
}

type USDCPurchaseBuyerNotificationProps = {
  notification: USDCPurchaseBuyerNotificationType
}

export const USDCPurchaseBuyerNotification = (
  props: USDCPurchaseBuyerNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed, entityType } = notification
  const dispatch = useDispatch()
  const content = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity | CollectionEntity>
  const notificationUsers = useSelector((state) =>
    getNotificationUsers(state, notification, 1)
  )
  const sellerUser = notificationUsers ? notificationUsers[0] : null

  const handleClick = useCallback(() => {
    if (content) {
      dispatch(push(getEntityLink(content)))
    }
  }, [dispatch, content])

  const handleShare = useCallback(
    (sellerHandle: string) => {
      const shareText = messages.twitterShare(
        getEntityTitle(content),
        sellerHandle,
        entityType
      )
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_USDC_PURCHASE_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText: content ? shareText : '', analytics }
    },
    [content, entityType]
  )

  if (!content || !sellerUser) return null
  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconCart />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        {messages.youJustPurchased}
        <EntityLink entity={content} entityType={entityType} />
        {messages.from}
        <UserNameLink user={sellerUser} notification={notification} />
        {messages.exclamation}
      </NotificationBody>
      <TwitterShareButton
        type='dynamic'
        url={getEntityLink(content, true)}
        handle={sellerUser.handle}
        shareData={handleShare}
      />
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
