import { useCallback } from 'react'

import type { Nullable } from '@audius/common'
import { useUIAudio } from 'audius-client/src/common/hooks/useUIAudio'
import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import type { TipReceive } from 'audius-client/src/common/store/notifications/types'
import type { ReactionTypes } from 'audius-client/src/common/store/ui/reactions/slice'
import {
  makeGetReactionForSignature,
  writeReactionValue
} from 'audius-client/src/common/store/ui/reactions/slice'
import { formatNumberCommas } from 'audius-client/src/common/utils/formatUtil'
import { Image, View } from 'react-native'

import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconTip from 'app/assets/images/iconTip.svg'
import { Text } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  ProfilePicture,
  TipText,
  UserNameLink,
  NotificationTwitterButton
} from '../Notification'
import { ReactionList } from '../Reaction'

import { useGoToProfile } from './useGoToProfile'

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
  notification: TipReceive
  isVisible: boolean
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const { notification, isVisible } = props
  const { amount, tipTxSignature } = notification
  const uiAmount = useUIAudio(amount)

  const user = useSelectorWeb(
    (state) => getNotificationUser(state, notification),
    isEqual
  )

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12
        }}
      >
        <ProfilePicture profile={user} />
        <NotificationText>
          <UserNameLink user={user} /> {messages.sent}{' '}
          <TipText value={uiAmount} />
        </NotificationText>
      </View>
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
