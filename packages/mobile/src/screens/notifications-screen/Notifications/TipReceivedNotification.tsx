import {
  notificationsSelectors,
  reactionsUIActions,
  reactionsUISelectors,
  TipReceiveNotification,
  ReactionTypes
} from '@audius/common/store'
import { useCallback } from 'react'

import type {} from '@audius/common'
import { useUIAudio } from '@audius/common/hooks'
import { formatNumberCommas } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { Image, Platform, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconTip from 'app/assets/images/iconTip.svg'
import { Text } from 'app/components/core'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { EventNames } from 'app/types/analytics'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  ProfilePicture,
  TipText,
  UserNameLink,
  NotificationTwitterButton,
  NotificationBody
} from '../Notification'
import { ReactionList } from '../Reaction'

const { writeReactionValue } = reactionsUIActions
const { makeGetReactionForSignature } = reactionsUISelectors
const { getNotificationUser } = notificationsSelectors

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
  twitterShare: (senderHandle: string, amount: number, ios: boolean) =>
    `Thanks ${senderHandle} for the ${formatNumberCommas(amount)} ${
      ios ? '$AUDIO' : '$AUDIO tip'
    } on @audius! #Audius ${ios ? '#AUDIO' : '#AUDIOTip'}`
}

const useSetReaction = (tipTxSignature: string) => {
  const dispatch = useDispatch()

  const setReactionValue = useCallback(
    (reaction: Nullable<ReactionTypes>) => {
      dispatch(writeReactionValue({ reaction, entityId: tipTxSignature }))
    },
    [tipTxSignature, dispatch]
  )
  return setReactionValue
}

type TipReceivedNotificationProps = {
  notification: TipReceiveNotification
  isVisible: boolean
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const { notification, isVisible } = props
  const { amount, tipTxSignature } = notification
  const uiAmount = useUIAudio(amount)
  const navigation = useNotificationNavigation()

  const user = useSelector((state) => getNotificationUser(state, notification))

  const reactionValue = useSelector(makeGetReactionForSignature(tipTxSignature))

  const setReactionValue = useSetReaction(tipTxSignature)

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleTwitterShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(
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
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>
          {Platform.OS === 'ios' ? messages.titleAlt : messages.title}
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <ProfilePicture profile={user} />
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
        selectedReaction={reactionValue || null}
        onChange={setReactionValue}
        isVisible={isVisible}
      />
      <NotificationTwitterButton
        type='dynamic'
        handle={user.handle}
        shareData={handleTwitterShare}
      />
    </NotificationTile>
  )
}
