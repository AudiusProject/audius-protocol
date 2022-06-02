import { useState } from 'react'

import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { TipReceived } from 'audius-client/src/common/store/notifications/types'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { Image, View } from 'react-native'

import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconTip from 'app/assets/images/iconTip.svg'
import { Text } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle,
  ProfilePicture,
  TipText,
  UserNameLink
} from '../Notification'
import { ReactionList, ReactionTypes } from '../Reaction'

const messages = {
  title: 'You Received a Tip!',
  sent: 'sent you a tip of',
  audio: '$AUDIO',
  sayThanks: 'Say Thanks With a Reaction',
  reactionSent: 'Reaction Sent!'
}

type TipReceivedNotificationProps = {
  notification: TipReceived
}

export const TipReceivedNotification = (
  props: TipReceivedNotificationProps
) => {
  const { notification } = props
  const { userId, value } = notification
  const user = useSelectorWeb(state => getUser(state, { id: userId }))
  const [selectedReaction, setSelectedReaction] = useState<
    Nullable<ReactionTypes>
  >(null)

  if (!user) return null

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        <ProfilePicture profile={user} />
        <NotificationText>
          <UserNameLink user={user} /> {messages.sent} <TipText value={value} />
        </NotificationText>
      </View>
      {selectedReaction ? (
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
        selectedReaction={selectedReaction}
        onChange={setSelectedReaction}
      />
    </NotificationTile>
  )
}
