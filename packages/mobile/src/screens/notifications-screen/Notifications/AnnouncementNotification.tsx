import type { AnnouncementNotification as AnnouncementNotificationType } from '@audius/common'
import { View } from 'react-native'
import Markdown from 'react-native-markdown-display'

import { IconAudius } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

import {
  NotificationHeader,
  NotificationTile,
  NotificationTitle
} from '../Notification'

const useStyles = makeStyles(({ typography, palette }) => ({
  title: {
    ...typography.h1,
    marginBottom: 0,
    color: palette.secondary
  },
  body: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.medium,
    lineHeight: 27,
    color: palette.neutral
  },
  link: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.medium,
    color: palette.secondary
  }
}))

type AnnouncementNotificationProps = {
  notification: AnnouncementNotificationType
}

export const AnnouncementNotification = (
  props: AnnouncementNotificationProps
) => {
  const { notification } = props
  const { title, shortDescription } = notification
  const styles = useStyles()

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={IconAudius}>
        <NotificationTitle>
          <View>
            <Markdown
              style={{ body: styles.title, link: styles.title }}
              mergeStyle
            >
              {title}
            </Markdown>
          </View>
        </NotificationTitle>
      </NotificationHeader>
      <View>
        <Markdown style={styles}>{shortDescription}</Markdown>
      </View>
    </NotificationTile>
  )
}
