import { useUIAudio } from 'audius-client/src/common/hooks/useUIAudio'
import { getNotificationUser } from 'audius-client/src/common/store/notifications/selectors'
import { Reaction } from 'audius-client/src/common/store/notifications/types'
import { getReactionFromRawValue } from 'audius-client/src/common/store/ui/reactions/slice'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import UserBadges from 'app/components/user-badges'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import {
  NotificationHeader,
  NotificationTile,
  NotificationTitle,
  UserNameLink,
  TipText,
  NotificationText,
  ProfilePicture
} from '../Notification'
import { reactionMap } from '../Reaction'

const messages = {
  reacted: 'reacted',
  react: 'reacted to your tip of '
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
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification } = props

  const {
    reactionValue,
    reactedToEntity: { amount }
  } = notification

  const uiAmount = useUIAudio(amount)
  const styles = useStyles()

  const user = useSelectorWeb(
    state => getNotificationUser(state, notification),
    isEqual
  )
  if (!user) return null

  const reactionType = getReactionFromRawValue(reactionValue)
  if (!reactionType) return null
  const Reaction = reactionMap[reactionType]

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconTip}>
        <NotificationTitle>
          <UserNameLink user={user} /> {messages.reacted}
        </NotificationTitle>
      </NotificationHeader>
      <View style={styles.body}>
        <View>
          <Reaction />
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
    </NotificationTile>
  )
}
