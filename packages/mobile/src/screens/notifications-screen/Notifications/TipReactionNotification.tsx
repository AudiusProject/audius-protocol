import { useCallback } from 'react'

import { useUIAudio } from 'audius-client/src/common/hooks/useUIAudio'
import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import type { Reaction } from 'audius-client/src/common/store/notifications/types'
import { getReactionFromRawValue } from 'audius-client/src/common/store/ui/reactions/slice'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import UserBadges from 'app/components/user-badges'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'

import {
  NotificationHeader,
  NotificationTile,
  NotificationTitle,
  UserNameLink,
  TipText,
  NotificationText,
  ProfilePicture,
  NotificationTwitterButton
} from '../Notification'
import { reactionMap } from '../Reaction'

import { useGoToProfile } from './useGoToProfile'

const messages = {
  reacted: 'reacted',
  react: 'reacted to your tip of ',
  twitterShare: (handle: string) =>
    `I got a thanks from ${handle} for tipping them $AUDIO on @audiusproject! #Audius #AUDIOTip`
}

const useStyles = makeStyles(() => ({
  body: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profilePicture: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: 26,
    width: 26
  },
  userNameLink: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  content: {
    flex: 1
  }
}))

type TipReactionNotificationProps = {
  notification: Reaction
  isVisible: boolean
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification, isVisible } = props

  const {
    reactionValue,
    reactedToEntity: { amount }
  } = notification

  const uiAmount = useUIAudio(amount)
  const styles = useStyles()

  const user = useSelectorWeb(
    (state) => getNotificationUser(state, notification),
    isEqual
  )

  const handlePress = useGoToProfile(user)

  const handleTwitterShare = useCallback((handle: string) => {
    const shareText = messages.twitterShare(handle)
    return {
      shareText,
      analytics: make({
        eventName: EventNames.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
        text: shareText
      })
    }
  }, [])

  if (!user) return null

  const reactionType = getReactionFromRawValue(reactionValue)
  if (!reactionType) return null
  const Reaction = reactionMap[reactionType]

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>
          <UserNameLink user={user} /> {messages.reacted}
        </NotificationTitle>
      </NotificationHeader>
      <View style={styles.body}>
        <View>
          <Reaction autoPlay={true} isVisible={isVisible} />
          <ProfilePicture profile={user} style={styles.profilePicture} />
        </View>
        <View style={styles.content}>
          <View style={styles.userNameLink}>
            <UserNameLink user={user} weight='bold' />
            <UserBadges user={user} hideName />
          </View>
          <NotificationText>
            {messages.react}
            <TipText value={uiAmount} />
          </NotificationText>
        </View>
      </View>
      <NotificationTwitterButton
        type='dynamic'
        shareData={handleTwitterShare}
        handle={user.handle}
      />
    </NotificationTile>
  )
}
