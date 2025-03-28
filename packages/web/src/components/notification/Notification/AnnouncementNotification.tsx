import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import {
  AnnouncementNotification as AnnouncementNotificationType,
  useAnnouncementModal
} from '@audius/common/store'
import cn from 'classnames'

import { make, useRecord } from 'common/store/analytics/actions'
import { MarkdownViewer } from 'components/markdown-viewer'

import styles from './AnnouncementNotification.module.css'
import { NotificationBody } from './components/NotificationBody'
import notificationBodyStyles from './components/NotificationBody.module.css'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { IconAnnouncement } from './components/icons'

const messages = {
  readMore: 'Read More'
}

type AnnouncementNotificationProps = {
  notification: AnnouncementNotificationType
}

export const AnnouncementNotification = (
  props: AnnouncementNotificationProps
) => {
  const { notification } = props
  const { title, shortDescription, longDescription, timeLabel, isViewed } =
    notification
  const record = useRecord()
  const { onOpen } = useAnnouncementModal()

  const handleOpenAnnouncementModal = useCallback(() => {
    onOpen({ announcementNotification: notification })
  }, [notification, onOpen])

  const handleClick = useCallback(() => {
    handleOpenAnnouncementModal()
    record(
      make(Name.NOTIFICATIONS_CLICK_TILE, { kind: 'announcement', link_to: '' })
    )
  }, [handleOpenAnnouncementModal, record])

  return (
    <NotificationTile
      notification={notification}
      onClick={longDescription ? handleClick : undefined}
      disableClosePanel
    >
      <NotificationHeader icon={<IconAnnouncement />}>
        <NotificationTitle>
          <MarkdownViewer className={styles.title} markdown={title} />
        </NotificationTitle>
      </NotificationHeader>
      <NotificationBody className={styles.body}>
        <MarkdownViewer
          markdown={shortDescription}
          className={cn(styles.description, notificationBodyStyles.root)}
        />
        {longDescription ? (
          <button
            className={cn(notificationBodyStyles.root, styles.readMore)}
            onClick={handleOpenAnnouncementModal}
          >
            {messages.readMore}
          </button>
        ) : null}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
