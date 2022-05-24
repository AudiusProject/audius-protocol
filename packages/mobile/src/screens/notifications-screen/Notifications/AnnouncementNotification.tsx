import { Announcement } from 'audius-client/src/common/store/notifications/types'
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
  body: {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium
  },
  link: {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium,
    color: palette.secondary
  }
}))

type AnnouncementNotificationProps = {
  notification: Announcement
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
          <Markdown>{title}</Markdown>
        </NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <Markdown style={styles}>{shortDescription}</Markdown>
      </NotificationText>
    </NotificationTile>
  )
}
