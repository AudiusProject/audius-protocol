import { useCallback } from 'react'

import type { ReactionTypes } from '@audius/common/api'
import {
  useReaction,
  useWriteReaction,
  useCurrentUserId,
  getReactionFromRawValue,
  useUser
} from '@audius/common/api'
import { useUIAudio } from '@audius/common/hooks'
import type { TipReceiveNotification } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { Image, Platform, View } from 'react-native'

import { IconTipping } from '@audius/harmony-native'
import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import { Text } from 'app/components/core'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { EventNames } from 'app/types/analytics'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  NotificationProfilePicture,
  TipText,
  UserNameLink,
  NotificationXButton,
  NotificationBody
} from '../Notification'
import { ReactionList } from '../Reaction'

const messages = {
  title: 'You Received a Tip!',
  // NOTE: Send tip -> Send $AUDIO change
  titleAlt: 'You Received $AUDIO!', // iOS only
  sent: 'sent you a tip of',
  sentAlt: 'sent you', // iOS only
  audio: '$AUDIO',
  sayThanks: 'Say Thanks With a Reaction',
  reactionSent: 'Reaction Sent!',
  // NOTE: Send tip -> Send $AUDIO change
  xShare: (senderHandle: string, amount: number, ios: boolean) =>
    `Thanks ${senderHandle} for the ${formatNumberCommas(amount)} ${
      ios ? '$AUDIO' : '$AUDIO tip'
    } on @audius! ${ios ? '' : ''}`
}

type TipReceivedNotificationProps = {
  notification: TipReceiveNotification
  isVisible: boolean
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const { notification, isVisible } = props
  const {
    amount,
    tipTxSignature,
    reactionValue: notificationReactionValue
  } = notification
  const uiAmount = useUIAudio(amount)
  const navigation = useNotificationNavigation()

  const { data: user } = useUser(notification.entityId)

  const { data: reaction } = useReaction(tipTxSignature, {
    // Only fetch if we don't have a reaction in the notification
    enabled: notificationReactionValue !== null
  })

  // Use the reaction from the query, falling back to notification data
  const reactionValue = (reaction?.reactionValue ??
    (notificationReactionValue
      ? getReactionFromRawValue(notificationReactionValue)
      : null)) as Nullable<ReactionTypes>

  const { mutate: writeReaction } = useWriteReaction()
  const { data: currentUserId } = useCurrentUserId()

  const handleReaction = useCallback(
    (reactionType: ReactionTypes) => {
      if (!currentUserId) return
      writeReaction({
        entityId: tipTxSignature,
        reaction: reactionType,
        userId: currentUserId
      })
    },
    [tipTxSignature, writeReaction, currentUserId]
  )

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleXShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.xShare(
        senderHandle,
        uiAmount,
        Platform.OS === 'ios'
      )
      return {
        shareText,
        analytics: {
          eventName: EventNames.NOTIFICATIONS_CLICK_TIP_RECEIVED_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    [uiAmount]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTipping}>
        <NotificationTitle>
          {Platform.OS === 'ios' ? messages.titleAlt : messages.title}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <NotificationProfilePicture profile={user} />
        <NotificationText>
          <UserNameLink user={user} />{' '}
          {Platform.OS === 'ios' ? messages.sentAlt : messages.sent}{' '}
          <TipText value={uiAmount} />
        </NotificationText>
      </NotificationBody>
      {reactionValue ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={Checkmark}
            style={{
              height: 18,
              width: 18,
              marginRight: 4,
              marginBottom: 4
            }}
          />
          <Text fontSize='large' weight='demiBold' color='neutralLight4'>
            {messages.reactionSent}
          </Text>
        </View>
      ) : (
        <Text fontSize='large' weight='demiBold' color='neutralLight4'>
          {messages.sayThanks}
        </Text>
      )}
      <ReactionList
        selectedReaction={reactionValue}
        onChange={handleReaction}
        isVisible={isVisible}
      />
      <NotificationXButton
        type='dynamic'
        handle={user.handle}
        shareData={handleXShare}
      />
    </NotificationTile>
  )
}
