import {
  notificationsSelectors,
  getReactionFromRawValue,
  ReactionNotification
} from '@audius/common/store'
import { useCallback } from 'react'

import type {} from '@audius/common'

import { useUIAudio } from '@audius/common/hooks'
import { Platform, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconTip from 'app/assets/images/iconTip.svg'
import UserBadges from 'app/components/user-badges'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
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

const { getNotificationUser } = notificationsSelectors

const messages = {
  reacted: 'reacted',
  // NOTE: Send tip -> Send $AUDIO change
  react: 'reacted to your tip of ',
  reactAltPrefix: 'reacted to the ', // iOS only
  reactAltSuffix: ' you sent them', // iOS only
  // NOTE: Send tip -> Send $AUDIO change
  twitterShare: (handle: string, ios: boolean) =>
    `I got a thanks from ${handle} for ${
      ios ? 'sending' : 'tipping'
    } them $AUDIO on @audius! #Audius ${ios ? '#AUDIO' : '#AUDIOTip'}`
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
  notification: ReactionNotification
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

  const navigation = useNotificationNavigation()
  const uiAmount = useUIAudio(amount)
  const styles = useStyles()

  const user = useSelector((state) => getNotificationUser(state, notification))

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  const handleTwitterShare = useCallback((handle: string) => {
    const shareText = messages.twitterShare(handle, Platform.OS === 'ios')
    return {
      shareText,
      analytics: {
        eventName: EventNames.NOTIFICATIONS_CLICK_TIP_REACTION_TWITTER_SHARE,
        text: shareText
      } as const
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
            {Platform.OS === 'ios' ? messages.reactAltPrefix : messages.react}
            <TipText value={uiAmount} />
            {Platform.OS === 'ios' ? messages.reactAltSuffix : ''}
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
