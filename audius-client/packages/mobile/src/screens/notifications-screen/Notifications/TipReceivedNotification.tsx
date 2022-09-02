import { useCallback } from 'react'

import {
  useUIAudio,
  formatNumberCommas,
  notificationsSelectors,
  reactionsUIActions,
  reactionsUISelectors
} from '@audius/common'
import type {
  Nullable,
  TipReceiveNotification,
  ReactionTypes
} from '@audius/common'
import { Image, View } from 'react-native'
import { useSelector } from 'react-redux'

import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconTip from 'app/assets/images/iconTip.svg'
import { Text } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make } from 'app/services/analytics'
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

import { useGoToProfile } from './useGoToProfile'
const { writeReactionValue } = reactionsUIActions
const { makeGetReactionForSignature } = reactionsUISelectors
const { getNotificationUser } = notificationsSelectors

const messages = {
  title: 'You Received a Tip!',
  sent: 'sent you a tip of',
  audio: '$AUDIO',
  sayThanks: 'Say Thanks With a Reaction',
  reactionSent: 'Reaction Sent!',
  twitterShare: (senderHandle: string, amount: number) =>
    `Thanks ${senderHandle} for the ${formatNumberCommas(
      amount
    )} $AUDIO tip on @AudiusProject! #Audius #AUDIOTip`
}

const useSetReaction = (tipTxSignature: string) => {
  const dispatch = useDispatchWeb()

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

  const user = useSelector((state) => getNotificationUser(state, notification))

  const reactionValue = useSelectorWeb(
    makeGetReactionForSignature(tipTxSignature)
  )

  const setReactionValue = useSetReaction(tipTxSignature)

  const handlePress = useGoToProfile(user)

  const handleTwitterShare = useCallback(
    (senderHandle: string) => {
      const shareText = messages.twitterShare(senderHandle, uiAmount)
      return {
        shareText,
        analytics: make({
          eventName: EventNames.NOTIFICATIONS_CLICK_TIP_RECEIVED_TWITTER_SHARE,
          text: shareText
        })
      }
    },
    [uiAmount]
  )

  if (!user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <ProfilePicture profile={user} />
        <NotificationText>
          <UserNameLink user={user} /> {messages.sent}{' '}
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
