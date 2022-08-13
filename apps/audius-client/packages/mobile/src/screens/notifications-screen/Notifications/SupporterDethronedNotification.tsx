import { useCallback } from 'react'

import type { Nullable } from '@audius/common'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import type { SupporterDethroned } from 'audius-client/src/common/store/notifications/types'
import { beginTip } from 'audius-client/src/common/store/tipping/slice'

import IconCrownSource from 'app/assets/images/crown2x.png'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'

import {
  NotificationBody,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationTwitterButton,
  ProfilePicture,
  UserNameLink
} from '../Notification'

type SupporterDethronedNotificationProps = {
  notification: SupporterDethroned
}

const messages = {
  title: "You've Been Dethroned!",
  body1: ' Dethroned You as ',
  body2: "'s #1 Top Supporter! Tip to Reclaim Your Spot?",
  twitterShare: (usurperHandle: string, supportingHandle: string) =>
    `${usurperHandle} Dethroned Me as ${supportingHandle}'s #1 Top Supporter! #Audius $AUDIO #AUDIOTip`
}

export const SupporterDethronedNotification = (
  props: SupporterDethronedNotificationProps
) => {
  const { notification } = props
  const { supportedUserId } = notification
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const usurpingUser = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )

  const supportedUser = useSelectorWeb((state) =>
    getUser(state, { id: supportedUserId })
  )

  const handlePress = useCallback(() => {
    dispatchWeb(beginTip({ user: supportedUser, source: 'dethroned' }))
    navigation.navigate({ native: { screen: 'TipArtist' } })
  }, [dispatchWeb, supportedUser, navigation])

  const handleShare = useCallback(
    (usurpingHandle: string, supportingHandle?: Nullable<string>) => {
      // This shouldn't happen
      if (!supportingHandle) {
        return null
      }
      const shareText = messages.twitterShare(usurpingHandle, supportingHandle)
      return {
        shareText,
        analytics: make({
          eventName: EventNames.NOTIFICATIONS_CLICK_DETHRONED_TWITTER_SHARE,
          text: shareText
        })
      }
    },
    []
  )

  if (!usurpingUser || !supportedUser) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader imageSource={IconCrownSource}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <ProfilePicture profile={supportedUser} />
        <NotificationText>
          <UserNameLink user={usurpingUser} />
          {messages.body1}
          <UserNameLink user={supportedUser} />
          {messages.body2}
        </NotificationText>
      </NotificationBody>
      <NotificationTwitterButton
        type='dynamic'
        handle={usurpingUser.handle}
        additionalHandle={supportedUser.handle}
        shareData={handleShare}
      />
    </NotificationTile>
  )
}
