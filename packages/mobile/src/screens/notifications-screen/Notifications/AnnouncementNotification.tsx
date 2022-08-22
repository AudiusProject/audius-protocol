import type { AnnouncementNotification as AnnouncementNotificationType } from '@audius/common'
import Markdown from 'react-native-markdown-display'

import IconAudius from 'app/assets/images/iconAudius.svg'
import { makeStyles } from 'app/styles'

import {
  NotificationHeader,
  NotificationText,
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
          <Markdown style={{ body: styles.title, link: styles.title }}>
            {title}
          </Markdown>
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <Markdown style={styles}>{shortDescription}</Markdown>
      </NotificationText>
    </NotificationTile>
  )
}
