import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { TipReaction } from 'audius-client/src/common/store/notifications/types'
import { View } from 'react-native'

import IconTip from 'app/assets/images/iconTip.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
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
import { reactions } from '../Reaction'

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
  content: {
    flex: 1
  }
}))

type TipReactionNotificationProps = {
  notification: TipReaction
}

export const TipReactionNotification = (
  props: TipReactionNotificationProps
) => {
  const { notification } = props
  const { userId, value, reaction } = notification
  const user = useSelectorWeb(state => getUser(state, { id: userId }))
  const styles = useStyles()
  if (!user) return null

  const Reaction = reactions[reaction]

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
          <UserNameLink user={user} />
          <NotificationText>
            {messages.react}
            <TipText value={value} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
